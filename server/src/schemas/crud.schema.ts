const { z } = require('zod');

const ROLES = z.enum(['Administrador', 'Contable', 'Colaborador', 'Lider/CoLider']);
const ESTADOS_USUARIO = z.enum(['Activo', 'Inactivo']).optional();
const COMPROBANTE = z.enum(['imagen', 'pdf']).optional();

/** Unifica `tipo` legacy de ingresos → `categoria`. */
function mergeCategoriaLegacy(val) {
  if (!val || typeof val !== 'object') return val;
  const categoria = val.categoria ?? val.tipo;
  const { tipo, ...rest } = val;
  return { ...rest, categoria };
}

const movimientoBase = {
  fecha: z.string().min(1).max(40),
  descripcion: z.string().trim().min(1, 'Descripción requerida').max(500),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0').max(999_999_999),
  foto: z.string().max(12_000_000).optional().default(''),
  ministerio: z.string().trim().min(1).max(200),
  ministerioId: z.coerce.number().int().positive().optional(),
  fechaFormateada: z.string().max(20).optional(),
  comprobanteTipo: COMPROBANTE,
  usuarioId: z.coerce.number().int().positive().optional(),
  registradoPor: z.string().max(200).optional()
};

const cuentaFields = {
  cuentaCodigo: z.string().trim().min(1).max(20).optional(),
  cuentaNombre: z.string().trim().min(1).max(120).optional()
};

const ingresoCreateSchema = z.preprocess(
  mergeCategoriaLegacy,
  z.object({
    ...movimientoBase,
    ...cuentaFields,
    categoria: z.string().trim().min(1).max(100)
  })
);

const ingresoUpdateSchema = z.preprocess(
  mergeCategoriaLegacy,
  z.object({
    ...movimientoBase,
    ...cuentaFields,
    categoria: z.string().trim().min(1).max(100)
  }).partial()
);

const gastoCreateSchema = z.object({
  ...movimientoBase,
  ...cuentaFields,
  categoria: z.string().trim().min(1).max(100),
  proveedor: z.string().max(200).optional()
});

const gastoUpdateSchema = gastoCreateSchema.partial();

const ministerioCreateSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido').max(200),
  estado: z.string().trim().min(1).max(50),
  hldrId: z.coerce.number().int().positive().nullable().optional(),
  coLiderId: z.coerce.number().int().positive().nullable().optional()
});

const ministerioUpdateSchema = ministerioCreateSchema.partial();

const usuarioCreateSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido').max(200),
  email: z.string().trim().email('Email inválido').max(200),
  rol: ROLES,
  estado: ESTADOS_USUARIO,
  ministerioId: z.coerce.number().int().positive().nullable().optional(),
  usuario: z.string().trim().min(1).max(50).optional(),
  password: z.string().min(6).max(128).optional()
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
