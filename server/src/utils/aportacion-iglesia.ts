const { db } = require('../config/firebase');
const {
  deleteFromCollection,
  getById,
  updateInCollection,
  formatDateDDMMYYYY,
  listCollection,
  listCollectionByField,
  allocateNextId
} = require('./firestore');
const {
  calcularMontoAportacionIglesia,
  etiquetaPorcentajeAportacion,
  MINISTERIO_IGLESIA_NOMBRE,
  ingresoEsTalento
} = require('../constants/aportacion-iglesia');

function ingresoRequiereAportacion(ingreso) {
  if (!ingreso || ingreso.esAportacionIglesia) return false;
  if (ingreso.aportacionGenerada) return false;
  if (!ingresoEsTalento(ingreso)) return false;
  const ministerioId = ingreso.ministerioId;
  if (ministerioId == null || ministerioId === '') return false;
  const monto = Number(ingreso.monto);
  if (!Number.isFinite(monto) || monto <= 0) return false;
  return calcularMontoAportacionIglesia(monto) > 0;
}

function ingresoEstaAprobado(ingreso) {
  const estado = ingreso?.estado;
  return !estado || estado === 'aprobado';
}

function referenciaIngresoOrigen(ingreso) {
  const detalle = String(ingreso?.descripcion ?? '').trim();
  return detalle || 'Sin descripción';
}

/** Id legacy determinístico (docs antiguos); los nuevos usan ID numérico secuencial. */
function aportacionDocId(origenId) {
  return `aportacion-${origenId}`;
}

/** Resuelve el ministerio General (fondo iglesia / aportación 33 %). */
async function resolverMinisterioIglesia() {
  const ministerios = await listCollection('ministerios');
  const m = ministerios.find(
    (row) => String(row?.nombre ?? '').trim().toLowerCase() === MINISTERIO_IGLESIA_NOMBRE.toLowerCase()
  );
  if (!m || m.id == null || m.id === '') {
    const err = new Error(
      'No está configurado el ministerio General para registrar la aportación del 33 %.'
    );
    err.status = 500;
    throw err;
  }
  return {
    id: Number(m.id),
    nombre: String(m.nombre).trim() || MINISTERIO_IGLESIA_NOMBRE
  };
}

async function vincularPadreConAportacion(ingreso, hijoId, montoBruto, montoAportacion) {
  const montoNetoMinisterio = Math.round((montoBruto - montoAportacion) * 100) / 100;
  return updateInCollection('ingresos', ingreso.id, {
    aportacionGenerada: true,
    ingresoIglesiaId: hijoId,
    montoAportacionIglesia: montoAportacion,
    montoNetoMinisterio
  });
}

async function generarAportacionIglesiaPorIngreso(ingreso, req) {
  if (!ingreso || ingreso.esAportacionIglesia) return ingreso;
  if (!ingresoEstaAprobado(ingreso)) return ingreso;
  if (!ingresoEsTalento(ingreso)) return ingreso;

  const ministerioId = ingreso.ministerioId;
  if (ministerioId == null || ministerioId === '') return ingreso;
  const montoBruto = Number(ingreso.monto);
  if (!Number.isFinite(montoBruto) || montoBruto <= 0) return ingreso;
  const montoAportacion = calcularMontoAportacionIglesia(montoBruto);
  if (montoAportacion <= 0) return ingreso;

  // Idempotencia: ya vinculada
  if (ingreso.aportacionGenerada && ingreso.ingresoIglesiaId != null) {
    const existente = await getById('ingresos', ingreso.ingresoIglesiaId);
    if (existente) return ingreso;
  }

  // Idempotencia: buscar aportación previa por origen
  const origenIdNum = Number(ingreso.id);
  const candidatos = [];
  for (const valor of [origenIdNum, String(ingreso.id)]) {
    if (valor == null || valor === '' || Number.isNaN(Number(valor))) continue;
    const rows = await listCollectionByField('ingresos', 'ingresoOrigenId', valor);
    candidatos.push(...rows);
  }
  const ya = candidatos.find((r) => r?.esAportacionIglesia);
  if (ya) {
    if (ya.ministerioId == null) {
      const general = await resolverMinisterioIglesia();
      await updateInCollection('ingresos', ya.id, {
        ministerioId: general.id,
        ministerio: general.nombre
      });
    }
    return vincularPadreConAportacion(ingreso, ya.id, montoBruto, montoAportacion);
  }

  // Legacy: docs creados con id "aportacion-{origen}"
  const legacyId = aportacionDocId(ingreso.id);
  const existingLegacy = await getById('ingresos', legacyId);
  if (existingLegacy?.esAportacionIglesia) {
    const general = await resolverMinisterioIglesia();
    if (existingLegacy.ministerioId == null) {
      await updateInCollection('ingresos', legacyId, {
        ministerioId: general.id,
        ministerio: general.nombre
      });
    }
    return vincularPadreConAportacion(ingreso, existingLegacy.id, montoBruto, montoAportacion);
  }

  const general = await resolverMinisterioIglesia();
  const childId = await allocateNextId('ingresos');
  const montoNetoMinisterio = Math.round((montoBruto - montoAportacion) * 100) / 100;
  const pct = etiquetaPorcentajeAportacion();
  const ministerioNombre = ingreso.ministerio || 'ministerio';
  const fecha = ingreso.fecha || new Date().toISOString();
  const fechaFormateada = ingreso.fechaFormateada || formatDateDDMMYYYY(fecha);
  const ref = referenciaIngresoOrigen(ingreso);

  const childData = {
    fecha,
    fechaFormateada,
    descripcion: `Aportación de ${ministerioNombre} (${pct}) — ${ref}`,
    monto: montoAportacion,
    // Mismo comprobante del ingreso origen (visible en General).
    foto: ingreso.foto || '',
    ...(ingreso.comprobanteTipo ? { comprobanteTipo: ingreso.comprobanteTipo } : {}),
    categoria: 'Aportación de ministerio',
    cuentaCodigo: '4101',
    cuentaNombre: 'Ingresos generales',
    ministerio: general.nombre,
    ministerioId: general.id,
    estado: 'aprobado',
    motivoRechazo: null,
    esAportacionIglesia: true,
    ingresoOrigenId: ingreso.id,
    registradoPor: 'Sistema IECA',
    aprobadoPor: req?.user?.sub ?? null,
    fechaAprobacion: new Date().toISOString()
  };

  const childRef = db.collection('ingresos').doc(String(childId));
  const parentRef = db.collection('ingresos').doc(String(ingreso.id));
  const parentPatch = {
    aportacionGenerada: true,
    ingresoIglesiaId: childId,
    montoAportacionIglesia: montoAportacion,
    montoNetoMinisterio
  };

  // Escritura atómica hijo + vínculo del padre (evita ingreso sin aportación 33 %)
  try {
    if (typeof db.batch === 'function') {
      const batch = db.batch();
      batch.set(childRef, childData);
      batch.set(parentRef, parentPatch, { merge: true });
      await batch.commit();
    } else if (typeof childRef.create === 'function') {
      await childRef.create(childData);
      await updateInCollection('ingresos', ingreso.id, parentPatch);
    } else {
      const snap = await childRef.get();
      if (snap.exists) {
        return vincularPadreConAportacion(ingreso, childId, montoBruto, montoAportacion);
      }
      await childRef.set(childData);
      await updateInCollection('ingresos', ingreso.id, parentPatch);
    }
  } catch {
    // Carrera: otro request creó el doc (por origen o por id)
    for (const valor of [Number(ingreso.id), String(ingreso.id)]) {
      if (valor == null || valor === '' || Number.isNaN(Number(valor))) continue;
      const rows = await listCollectionByField('ingresos', 'ingresoOrigenId', valor);
      const race = rows.find((r) => r?.esAportacionIglesia);
      if (race) {
        return vincularPadreConAportacion(ingreso, race.id, montoBruto, montoAportacion);
      }
    }
    throw new Error('No se pudo generar la aportación del 33 % a la iglesia');
  }

  const linked = await getById('ingresos', ingreso.id);
  return linked || { ...ingreso, ...parentPatch };
}

async function eliminarMovimientoSiExiste(collection, id) {
  if (id == null || id === '') return;
  const current = await getById(collection, id);
  if (!current) return;
  await deleteFromCollection(collection, id);
}

async function eliminarAportacionesPorIngresoOrigen(ingresoOrigenId) {
  if (ingresoOrigenId == null || ingresoOrigenId === '') return;
  const origenId = Number(ingresoOrigenId);
  if (!Number.isFinite(origenId)) return;

  const eliminados = new Set();
  // Doc determinístico
  const detId = aportacionDocId(ingresoOrigenId);
  await eliminarMovimientoSiExiste('ingresos', detId);
  eliminados.add(detId);

  for (const valor of [origenId, String(origenId)]) {
    const vinculados = await listCollectionByField('ingresos', 'ingresoOrigenId', valor);
    for (const row of vinculados) {
      if (!row?.esAportacionIglesia || eliminados.has(row.id)) continue;
      eliminados.add(row.id);
      await deleteFromCollection('ingresos', row.id);
    }
  }
}

async function revertirAportacionIglesiaPorIngreso(ingreso) {
  if (!ingreso) return;

  if (ingreso.esAportacionIglesia) {
    const err = new Error('No se puede eliminar directamente un movimiento de aportación a la iglesia');
    err.status = 403;
    throw err;
  }

  await eliminarMovimientoSiExiste('ingresos', ingreso.ingresoIglesiaId);
  await eliminarAportacionesPorIngresoOrigen(ingreso.id);

  // Limpieza de registros antiguos que generaban un gasto automático.
  if (ingreso.gastoAportacionId != null) {
    await eliminarMovimientoSiExiste('gastos', ingreso.gastoAportacionId);
  }
}

async function actualizarAportacionIglesiaPorIngreso(ingreso, _req, previous) {
  if (!ingreso) return ingreso;

  // Si dejó de ser talento (p. ej. cambió de cuenta 4105), revertir aportación huérfana
  if (ingreso.aportacionGenerada || ingreso.ingresoIglesiaId != null) {
    if (!ingresoEsTalento(ingreso) || !ingresoEstaAprobado(ingreso)) {
      await revertirAportacionIglesiaPorIngreso(ingreso);
      return updateInCollection('ingresos', ingreso.id, {
        aportacionGenerada: false,
        ingresoIglesiaId: null,
        montoAportacionIglesia: null,
        montoNetoMinisterio: null
      });
    }
  }

  if (!ingreso?.aportacionGenerada || ingreso.ingresoIglesiaId == null) {
    // Si ahora es talento aprobado y no tiene aportación, generarla
    if (ingresoEsTalento(ingreso) && ingresoEstaAprobado(ingreso) && !ingreso.esAportacionIglesia) {
      return generarAportacionIglesiaPorIngreso(
        { ...ingreso, aportacionGenerada: false },
        _req
      );
    }
    return ingreso;
  }

  const montoAnterior = Number(previous?.monto);
  const montoNuevo = Number(ingreso.monto);
  if (!Number.isFinite(montoNuevo) || montoNuevo <= 0) {
    return ingreso;
  }

  const fotoCambio = (ingreso.foto || '') !== (previous?.foto || '');
  const tipoCambio = (ingreso.comprobanteTipo || '') !== (previous?.comprobanteTipo || '');
  const fechaCambio =
    (ingreso.fecha || '') !== (previous?.fecha || '') ||
    (ingreso.fechaFormateada || '') !== (previous?.fechaFormateada || '');
  const descCambio = (ingreso.descripcion || '') !== (previous?.descripcion || '');
  const montoCambio = montoAnterior !== montoNuevo;

  if (!montoCambio && !fotoCambio && !tipoCambio && !fechaCambio && !descCambio) {
    return ingreso;
  }

  const montoAportacion = calcularMontoAportacionIglesia(montoNuevo);
  const montoNetoMinisterio = Math.round((montoNuevo - montoAportacion) * 100) / 100;
  const pct = etiquetaPorcentajeAportacion();
  const ministerioNombre = ingreso.ministerio || 'ministerio';
  const ref = referenciaIngresoOrigen(ingreso);
  const fecha = ingreso.fecha || previous?.fecha || new Date().toISOString();
  const fechaFormateada = ingreso.fechaFormateada || formatDateDDMMYYYY(fecha);

  const general = await resolverMinisterioIglesia();
  const ingresoIglesia = await getById('ingresos', ingreso.ingresoIglesiaId);
  if (ingresoIglesia) {
    await updateInCollection('ingresos', ingreso.ingresoIglesiaId, {
      monto: montoAportacion,
      descripcion: `Aportación de ${ministerioNombre} (${pct}) — ${ref}`,
      fecha,
      fechaFormateada,
      foto: ingreso.foto || '',
      ...(ingreso.comprobanteTipo
        ? { comprobanteTipo: ingreso.comprobanteTipo }
        : { comprobanteTipo: null }),
      ministerio: general.nombre,
      ministerioId: general.id
    });
  }

  return updateInCollection('ingresos', ingreso.id, {
    montoAportacionIglesia: montoAportacion,
    montoNetoMinisterio
  });
}

function bloquearEdicionAportacionIglesia(entity) {
  if (entity?.esAportacionIglesia) {
    return {
      ok: false,
      message: 'Este movimiento se generó automáticamente por la aportación del 33% a la iglesia y no se puede modificar'
    };
  }
  return null;
}

module.exports = {
  ingresoRequiereAportacion,
  generarAportacionIglesiaPorIngreso,
  actualizarAportacionIglesiaPorIngreso,
  revertirAportacionIglesiaPorIngreso,
  bloquearEdicionAportacionIglesia,
  calcularMontoAportacionIglesia,
  aportacionDocId
};
