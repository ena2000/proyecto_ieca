const { z } = require('zod');

const cierreSchema = z.object({
  periodo: z.string().trim().min(1).max(50).optional()
});

const emptyToUndefined = (v) => (v === '' || v == null ? undefined : v);

const auditoriaQuerySchema = z.object({
  tipo: z.preprocess(
    emptyToUndefined,
    z.enum(['todos', 'ingresos', 'gastos']).optional().default('todos')
  ),
  desde: z.preprocess(emptyToUndefined, z.string().max(40).optional()),
  hasta: z.preprocess(emptyToUndefined, z.string().max(40).optional())
});

/** Estructura mínima de un respaldo válido; el resto lo valida restoreBackup. */
const restoreSchema = z.object({
  version: z.string().min(1).max(20),
  fecha: z.string().optional(),
  ingresos: z.array(z.record(z.string(), z.unknown())),
  gastos: z.array(z.record(z.string(), z.unknown())),
  ministerios: z.array(z.record(z.string(), z.unknown())),
  usuarios: z.array(z.record(z.string(), z.unknown())),
  notificaciones: z.array(z.record(z.string(), z.unknown())).optional(),
  ultimoCierre: z.unknown().optional(),
  periodosCerrados: z.array(z.unknown()).optional()
});

module.exports = {
  cierreSchema,
  auditoriaQuerySchema,
  restoreSchema
};
