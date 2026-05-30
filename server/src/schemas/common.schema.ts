const { z } = require('zod');

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID inválido')
});

const optionalIsoDate = z
  .string()
  .max(30)
  .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Fecha inválida')
  .optional();

const motivoRechazoSchema = z.object({
  motivo: z.string().max(500).optional()
});

module.exports = {
  idParamSchema,
  optionalIsoDate,
  motivoRechazoSchema
};
