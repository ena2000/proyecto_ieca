const { z } = require('zod');

const TIPOS = z.enum(['ingreso', 'gasto', 'cierre']);

const createNotificacionSchema = z.object({
  tipo: TIPOS,
  titulo: z.string().trim().min(1).max(200),
  mensaje: z.string().trim().min(1).max(1000),
  ruta: z.string().max(200).optional(),
  entityId: z.union([z.number(), z.string()]).optional()
});

const marcarPorRutaSchema = z.object({
  ruta: z.string().trim().min(1).max(200)
});

const marcarPorTipoSchema = z.object({
  tipo: TIPOS
});

module.exports = {
  createNotificacionSchema,
  marcarPorRutaSchema,
  marcarPorTipoSchema
};
