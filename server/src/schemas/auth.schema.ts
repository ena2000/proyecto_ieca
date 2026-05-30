const { z } = require('zod');

const loginSchema = z.object({
  usuario: z.string().trim().min(1, 'Usuario requerido').max(50),
  password: z.string().min(1, 'Contraseña requerida').max(128)
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Contraseña actual requerida').max(128),
  newPassword: z.string().trim().min(6, 'La nueva contraseña debe tener al menos 6 caracteres').max(128)
});

const forgotPasswordSchema = z.object({
  usuario: z.string().trim().min(1, 'Usuario o email requerido').max(200)
});

const resetPasswordSchema = z.object({
  usuario: z.string().trim().min(1, 'Usuario o email requerido').max(200),
  code: z.string().trim().regex(/^\d{6}$/, 'El código debe tener 6 dígitos'),
  newPassword: z.string().trim().min(6, 'La nueva contraseña debe tener al menos 6 caracteres').max(128)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido').max(4096)
});

module.exports = {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema
};
