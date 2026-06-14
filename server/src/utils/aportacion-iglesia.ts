const {
  createInCollection,
  deleteFromCollection,
  getById,
  updateInCollection,
  formatDateDDMMYYYY
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

async function generarAportacionIglesiaPorIngreso(ingreso, req) {
  if (!ingresoRequiereAportacion(ingreso) || !ingresoEstaAprobado(ingreso)) {
    return ingreso;
  }

  const montoBruto = Number(ingreso.monto);
  const montoAportacion = calcularMontoAportacionIglesia(montoBruto);
  const montoNetoMinisterio = Math.round((montoBruto - montoAportacion) * 100) / 100;
  const pct = etiquetaPorcentajeAportacion();
  const ministerioNombre = ingreso.ministerio || 'ministerio';
  const fecha = ingreso.fecha || new Date().toISOString();
  const fechaFormateada = ingreso.fechaFormateada || formatDateDDMMYYYY(fecha);
  const ref = `ingreso #${ingreso.id}`;

  const ingresoIglesia = await createInCollection('ingresos', {
    fecha,
    fechaFormateada,
    descripcion: `Aportación de ${ministerioNombre} (${pct}) — ${ref}`,
    monto: montoAportacion,
    foto: '',
    categoria: 'Aportación de ministerio',
    cuentaCodigo: '4101',
    cuentaNombre: 'Ingresos generales',
    ministerio: MINISTERIO_IGLESIA_NOMBRE,
    ministerioId: null,
    estado: 'aprobado',
    motivoRechazo: null,
    esAportacionIglesia: true,
    ingresoOrigenId: ingreso.id,
    registradoPor: 'Sistema IECA',
    aprobadoPor: req?.user?.sub ?? null,
    fechaAprobacion: new Date().toISOString()
  });

  return updateInCollection('ingresos', ingreso.id, {
    aportacionGenerada: true,
    ingresoIglesiaId: ingresoIglesia.id,
    montoAportacionIglesia: montoAportacion,
    montoNetoMinisterio
  });
}

async function eliminarMovimientoSiExiste(collection, id) {
  if (id == null || id === '') return;
  const current = await getById(collection, id);
  if (!current) return;
  await deleteFromCollection(collection, id);
}

async function revertirAportacionIglesiaPorIngreso(ingreso) {
  if (!ingreso) return;

  if (ingreso.esAportacionIglesia) {
    const err = new Error('No se puede eliminar directamente un movimiento de aportación a la iglesia');
    err.status = 403;
    throw err;
  }

  await eliminarMovimientoSiExiste('ingresos', ingreso.ingresoIglesiaId);

  // Limpieza de registros antiguos que generaban un gasto automático.
  if (ingreso.gastoAportacionId != null) {
    await eliminarMovimientoSiExiste('gastos', ingreso.gastoAportacionId);
  }
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
  revertirAportacionIglesiaPorIngreso,
  bloquearEdicionAportacionIglesia,
  calcularMontoAportacionIglesia
};
