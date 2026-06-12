/**
 * Genera un respaldo JSON demo con datos aleatorios (modelo Colaborador).
 */

const NOMBRES_MINISTERIO = [
  'Alabanza y Adoración',
  'Jóvenes',
  'Niños',
  'Damas',
  'Evangelismo',
  'Misiones',
  'Intercesión',
  'Medios y Comunicación',
  'Matrimonios',
  'Ujeres'
];

const NOMBRES = [
  'Carlos', 'María', 'José', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofía',
  'Miguel', 'Elena', 'Daniel', 'Patricia', 'Andrés', 'Lucía', 'Jorge', 'Carmen'
];

const APELLIDOS = [
  'García', 'Rodríguez', 'Martínez', 'López', 'Hernández', 'Pérez',
  'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez'
];

const CUENTAS_INGRESO = [
  { codigo: '4101', nombre: 'Ingresos generales' },
  { codigo: '4102', nombre: 'Diezmos y ofrendas' },
  { codigo: '4103', nombre: 'Donaciones' },
  { codigo: '4104', nombre: 'Ofrendas especiales' },
  { codigo: '4105', nombre: 'Talento y eventos' },
  { codigo: '4106', nombre: 'Otros ingresos' }
];

const CUENTAS_GASTO = [
  { codigo: '5101', nombre: 'Gastos operativos' },
  { codigo: '5102', nombre: 'Gastos por ministerio' },
  { codigo: '5103', nombre: 'Servicios y suministros' },
  { codigo: '5104', nombre: 'Mantenimiento' },
  { codigo: '5105', nombre: 'Personal y honorarios' },
  { codigo: '5106', nombre: 'Impuestos y tasas' },
  { codigo: '5107', nombre: 'Otros gastos' }
];

const TIPOS_INGRESO = ['Ofrenda', 'Diezmo', 'Donación', 'Talento', 'Evento especial'];
const CATEGORIAS_GASTO = ['Materiales', 'Transporte', 'Alimentación', 'Servicios', 'Equipos', 'Evento'];

const DESCR_INGRESO = [
  'Ofrenda dominical', 'Diezmo mensual', 'Donación anónima', 'Recaudación talento',
  'Aportación campaña', 'Venta de alimentos', 'Ofrenda especial', 'Donación familiar'
];

const DESCR_GASTO = [
  'Compra de materiales', 'Transporte actividad', 'Refrigerios reunión',
  'Mantenimiento local', 'Papelería', 'Servicio de sonido', 'Decoración evento',
  'Combustible', 'Honorarios servicio'
];

function createRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function shuffle(rng, arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 40);
}

function formatDateDDMMYYYY(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function randomDateInLastMonths(rng, monthsBack = 5) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const end = now;
  const ts = start.getTime() + rng() * (end.getTime() - start.getTime());
  return new Date(ts).toISOString();
}

function nombrePersona(rng) {
  return `${pick(rng, NOMBRES)} ${pick(rng, APELLIDOS)}`;
}

/**
 * @param {{ seed?: number }} [opts]
 */
function generateRandomBackup(opts = {}) {
  const seed = opts.seed ?? Date.now();
  const rng = createRng(seed);

  const cantMinisterios = randInt(rng, 5, 8);
  const nombresMin = shuffle(rng, NOMBRES_MINISTERIO).slice(0, cantMinisterios);

  const ministerios = nombresMin.map((nombre, idx) => {
    const id = idx + 1;
    const inactivo = rng() < 0.12;
    return {
      id,
      nombre,
      estado: inactivo ? 'Inactivo' : pick(rng, ['Activo', 'Activo', 'Activo', 'Pausado']),
      fecha: randomDateInLastMonths(rng, 18)
    };
  });

  const ministeriosActivos = ministerios.filter((m) => m.estado !== 'Inactivo');

  const usuarios = [
    {
      id: 1,
      usuario: 'admin',
      nombre: 'Administrador IECA',
      email: 'admin@ieca.demo',
      rol: 'Administrador',
      estado: 'Activo',
      password: '123456'
    },
    {
      id: 2,
      usuario: 'contable',
      nombre: 'María Contable',
      email: 'contable@ieca.demo',
      rol: 'Contable',
      estado: 'Activo',
      password: '123456'
    }
  ];

  let nextUserId = 3;
  const colaboradoresPorMinisterio = new Map();

  for (const min of ministeriosActivos) {
    const cant = randInt(rng, 1, 3);
    const lista = [];
    for (let i = 0; i < cant; i++) {
      const nombre = nombrePersona(rng);
      const login = `${slugify(min.nombre)}.${slugify(nombre.split(' ')[0])}${i || ''}`;
      const user = {
        id: nextUserId,
        usuario: login,
        nombre,
        email: `${login}@ieca.demo`,
        rol: 'Colaborador',
        estado: rng() < 0.08 ? 'Inactivo' : 'Activo',
        ministerioId: min.id,
        password: '123456'
      };
      usuarios.push(user);
      if (user.estado === 'Activo') lista.push(user);
      nextUserId += 1;
    }
    colaboradoresPorMinisterio.set(min.id, lista);
  }

  const ingresos = [];
  const gastos = [];
  let nextIngresoId = 1;
  let nextGastoId = 1;

  const staffUsers = usuarios.filter((u) => u.rol === 'Administrador' || u.rol === 'Contable');
  const colaboradores = usuarios.filter((u) => u.rol === 'Colaborador' && u.estado === 'Activo');

  function actorAleatorio(esColaborador) {
    if (esColaborador && colaboradores.length) {
      return pick(rng, colaboradores);
    }
    return pick(rng, staffUsers);
  }

  const cantIngresos = randInt(rng, 18, 32);
  const cantGastos = randInt(rng, 14, 26);

  for (let i = 0; i < cantIngresos; i++) {
    const min = pick(rng, ministeriosActivos);
    const esColaborador = rng() < 0.45;
    const actor = esColaborador
      ? (colaboradoresPorMinisterio.get(min.id)?.[0] ?? pick(rng, colaboradores))
      : actorAleatorio(false);
    const cuenta = pick(rng, CUENTAS_INGRESO);
    const fecha = randomDateInLastMonths(rng, 4);
    let estado = 'aprobado';
    if (esColaborador) {
      estado = rng() < 0.55 ? 'pendiente' : rng() < 0.75 ? 'aprobado' : 'rechazado';
    } else if (actor.rol === 'Contable') {
      estado = rng() < 0.7 ? 'pendiente' : 'aprobado';
    }

    const row = {
      id: nextIngresoId++,
      fecha,
      descripcion: `${pick(rng, DESCR_INGRESO)} — ${min.nombre}`,
      monto: randInt(rng, 30, 2800),
      foto: '',
      tipo: pick(rng, TIPOS_INGRESO),
      cuentaCodigo: cuenta.codigo,
      cuentaNombre: cuenta.nombre,
      ministerio: min.nombre,
      ministerioId: min.id,
      usuarioId: actor.id,
      registradoPor: actor.nombre,
      fechaFormateada: formatDateDDMMYYYY(fecha),
      estado,
      auditCreadoPorId: String(actor.id),
      auditCreadoPorNombre: actor.nombre,
      auditCreadoEn: fecha
    };

    if (estado === 'aprobado') {
      row.aprobadoPor = 'Administrador IECA';
      row.fechaAprobacion = fecha;
    }
    if (estado === 'rechazado') {
      row.rechazadoPor = 'Administrador IECA';
      row.fechaRechazo = fecha;
      row.motivoRechazo = pick(rng, [
        'Falta comprobante',
        'Monto no coincide con recibo',
        'Ministerio incorrecto',
        'Descripción incompleta'
      ]);
    }

    ingresos.push(row);
  }

  for (let i = 0; i < cantGastos; i++) {
    const min = pick(rng, ministeriosActivos);
    const esColaborador = rng() < 0.5;
    const actor = esColaborador
      ? (colaboradoresPorMinisterio.get(min.id)?.[0] ?? pick(rng, colaboradores))
      : actorAleatorio(false);
    const cuenta = pick(rng, CUENTAS_GASTO);
    const fecha = randomDateInLastMonths(rng, 4);
    let estado = 'aprobado';
    if (esColaborador) {
      estado = rng() < 0.5 ? 'pendiente' : rng() < 0.8 ? 'aprobado' : 'rechazado';
    } else if (actor.rol === 'Contable') {
      estado = rng() < 0.65 ? 'pendiente' : 'aprobado';
    }

    const row = {
      id: nextGastoId++,
      fecha,
      descripcion: `${pick(rng, DESCR_GASTO)} — ${min.nombre}`,
      monto: randInt(rng, 15, 1900),
      foto: '',
      categoria: pick(rng, CATEGORIAS_GASTO),
      proveedor: rng() < 0.6 ? pick(rng, ['Proveedor local', 'Tienda ABC', 'Servicios XYZ', '']) : '',
      cuentaCodigo: cuenta.codigo,
      cuentaNombre: cuenta.nombre,
      ministerio: min.nombre,
      ministerioId: min.id,
      usuarioId: actor.id,
      registradoPor: actor.nombre,
      fechaFormateada: formatDateDDMMYYYY(fecha),
      estado,
      auditCreadoPorId: String(actor.id),
      auditCreadoPorNombre: actor.nombre,
      auditCreadoEn: fecha
    };

    if (estado === 'aprobado') {
      row.aprobadoPor = 'Administrador IECA';
      row.fechaAprobacion = fecha;
    }
    if (estado === 'rechazado') {
      row.rechazadoPor = 'Administrador IECA';
      row.fechaRechazo = fecha;
      row.motivoRechazo = pick(rng, [
        'Sin factura adjunta',
        'Gasto no autorizado',
        'Periodo cerrado parcialmente',
        'Duplicado'
      ]);
    }

    gastos.push(row);
  }

  return {
    fecha: new Date().toISOString(),
    version: 'v1.0.0',
    seed,
    ministerios,
    usuarios,
    ingresos,
    gastos,
    notificaciones: [],
    ultimoCierre: null,
    periodosCerrados: []
  };
}

module.exports = { generateRandomBackup };
