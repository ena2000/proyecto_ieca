const { z } = require('zod');
const { esEmailProveedorConocido } = require('../utils/email-proveedor');
const { passwordNuevaSchema } = require('./auth.schema');

const ROLES = z.enum(['Administrador', 'Contable', 'Colaborador', 'Lider/CoLider']);
const ESTADOS_USUARIO = z.enum(['Activo', 'Inactivo']).optional();
const ESTADOS_MINISTERIO = z.enum(['Activo', 'Pausado', 'Inactivo']);
const COMPROBANTE = z.enum(['imagen', 'pdf']).optional();

/** Unifica `tipo` legacy de ingresos → `categoria`. */
function mergeCategoriaLegacy(val) {
  if (!val || typeof val !== 'object') return val;
  const categoria = val.categoria ?? val.tipo;
  const { tipo, ...rest } = val;
  return { ...rest, categoria };
}

const CUENTAS_INGRESO = ['4101', '4102', '4103', '4104', '4105', '4106'];
const CUENTAS_GASTO = ['5101', '5102', '5103', '5104', '5105', '5106', '5107'];

function esFechaCalendarioValidaDesdeFormateada(fechaFormateada) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(fechaFormateada ?? '').trim());
  if (!m) return false;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (yyyy < 2000 || yyyy > 2100 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

function esFechaIsoODiaValida(fecha) {
  const raw = String(fecha ?? '').trim();
  if (!raw) return false;
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (ymd) {
    const yyyy = Number(ymd[1]);
    const mm = Number(ymd[2]);
    const dd = Number(ymd[3]);
    if (yyyy < 2000 || yyyy > 2100 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
    const d = new Date(yyyy, mm - 1, dd);
    return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
  }
  const d = new Date(raw);
  return !Number.isNaN(d.getTime());
}

/** Límite alineado con el frontend (~350 KB archivo → ~500 KB data URL). */
const MAX_FOTO_BASE64_CHARS = 600_000;

const fotoSchema = z
  .string()
  .max(MAX_FOTO_BASE64_CHARS, 'El comprobante supera el tamaño máximo permitido (~350 KB).')
  .optional()
  .default('')
  .refine(
    (v) =>
      !v ||
      v === '' ||
      /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(v) ||
      /^data:application\/pdf;base64,/i.test(v),
    { message: 'El comprobante debe ser imagen (JPEG/PNG/WebP) o PDF válido.' }
  );

const movimientoBase = {
  fecha: z
    .string()
    .min(1, 'Fecha requerida')
    .max(40)
    .refine((v) => esFechaIsoODiaValida(v), {
      message: 'La fecha no es válida.'
    }),
  descripcion: z
    .string()
    .trim()
    .min(3, 'Descripción requerida (mín. 3 caracteres)')
    .max(500)
    .refine((v) => !/[<>]/.test(v), {
      message: 'La descripción contiene caracteres no permitidos.'
    }),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0').max(999_999_999),
  foto: fotoSchema,
  ministerio: z.string().trim().min(1).max(200),
  ministerioId: z.coerce.number().int().positive().optional(),
  fechaFormateada: z
    .string()
    .max(20)
    .optional()
    .refine(
      (v) => v == null || v === '' || esFechaCalendarioValidaDesdeFormateada(v),
      { message: 'La fecha formateada no es válida (revisa día y mes).' }
    ),
  comprobanteTipo: COMPROBANTE,
  usuarioId: z.coerce.number().int().positive().optional(),
  registradoPor: z.string().max(200).optional()
};

const ingresoCreateSchema = z.preprocess(
  mergeCategoriaLegacy,
  z.object({
    ...movimientoBase,
    ministerioId: z.coerce.number().int().positive('Ministerio requerido'),
    cuentaCodigo: z.enum(CUENTAS_INGRESO),
    cuentaNombre: z.string().trim().min(1).max(120).optional(),
    categoria: z.string().trim().min(1).max(100)
  })
);

const ingresoUpdateSchema = z.preprocess(
  mergeCategoriaLegacy,
  z.object({
    ...movimientoBase,
    cuentaCodigo: z.enum(CUENTAS_INGRESO).optional(),
    cuentaNombre: z.string().trim().min(1).max(120).optional(),
    categoria: z.string().trim().min(1).max(100)
  }).partial()
);

const gastoCreateSchema = z.object({
  ...movimientoBase,
  ministerioId: z.coerce.number().int().positive('Ministerio requerido'),
  cuentaCodigo: z.enum(CUENTAS_GASTO),
  cuentaNombre: z.string().trim().min(1).max(120).optional(),
  categoria: z.string().trim().min(1).max(100),
  proveedor: z.string().max(200).optional()
});

const gastoUpdateSchema = gastoCreateSchema.partial();

const {
  MINISTERIO_NOMBRE_MAX,
  MINISTERIO_NOMBRE_MIN,
  validarNombreMinisterio
} = require('../utils/ministerio-nombre');

const ministerioCreateSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(MINISTERIO_NOMBRE_MIN, `El nombre debe tener al menos ${MINISTERIO_NOMBRE_MIN} caracteres`)
    .max(MINISTERIO_NOMBRE_MAX, `El nombre no puede superar ${MINISTERIO_NOMBRE_MAX} caracteres`)
    .superRefine((val, ctx) => {
      const err = validarNombreMinisterio(val);
      if (err) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
      }
    }),
  estado: ESTADOS_MINISTERIO,
  hldrId: z.coerce.number().int().positive().nullable().optional(),
  coLiderId: z.coerce.number().int().positive().nullable().optional()
});

const ministerioUpdateSchema = ministerioCreateSchema.partial();

const usuarioCreateSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'Nombre requerido (mín. 3 caracteres)')
    .max(200)
    .refine((v) => !/[<>]/.test(v), { message: 'El nombre contiene caracteres no permitidos.' }),
  email: z
    .string()
    .trim()
    .email('Email inválido')
    .max(200)
    .refine((v) => esEmailProveedorConocido(v), {
      message: 'Usa un correo de Gmail, Outlook, Hotmail, Yahoo u otro proveedor conocido.'
    }),
  rol: ROLES,
  estado: ESTADOS_USUARIO,
  ministerioId: z.coerce.number().int().positive().nullable().optional(),
  usuario: z
    .string()
    .trim()
    .regex(/^[a-z0-9._]{3,50}$/i, 'Usuario: solo letras, números, punto o guion bajo (3-50).')
    .optional(),
  password: passwordNuevaSchema.optional()
});

const usuarioUpdateSchema = usuarioCreateSchema.partial();

module.exports = {
  ingresoCreateSchema,
  ingresoUpdateSchema,
  gastoCreateSchema,
  gastoUpdateSchema,
  ministerioCreateSchema,
  ministerioUpdateSchema,
  usuarioCreateSchema,
  usuarioUpdateSchema
};
