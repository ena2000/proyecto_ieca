const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildPasswordResetEmail,
  buildTestEmail,
  buildOperationalDigestEmail,
  resolveLogoPath
} = require('../src/utils/email-templates');

describe('email-templates', () => {
  it('incluye HTML con marca IECA en recuperación de contraseña', () => {
    const { html, text, subject } = buildPasswordResetEmail({
      usuario: 'admin',
      code: '123456'
    });

    assert.match(subject, /IECA/);
    assert.match(html, /123456/);
    assert.match(html, /Restablecer contraseña/);
    assert.match(html, /La Alborada/);
    assert.match(text, /123456/);
  });

  it('genera resumen operativo HTML con pendientes y cierre', () => {
    const resumen = {
      horasPendiente: 48,
      pendientes: [
        {
          tipo: 'gasto',
          id: 3,
          descripcion: 'mant',
          monto: 1000,
          ministerio: 'Alabanza'
        }
      ],
      cierre: {
        activo: true,
        etiquetaMes: 'Mayo 2026',
        diasRestantes: 1
      },
      tieneContenido: true,
      generadoEn: '2026-05-30T12:00:00.000Z'
    };

    const { html, text, subject } = buildOperationalDigestEmail(resumen);

    assert.match(subject, /pendiente/);
    assert.match(html, /Pendientes de aprobación/);
    assert.match(html, /Recordatorio de cierre mensual/);
    assert.match(html, /\$ 1,000\.00/);
    assert.match(text, /mant/);
  });

  it('resuelve logo del proyecto si existe', () => {
    const logo = resolveLogoPath();
    if (logo) {
      assert.match(logo, /logo_ieca/i);
    }
  });

  it('correo de prueba incluye mensaje de confirmación', () => {
    const { html, subject } = buildTestEmail();
    assert.match(subject, /Prueba/);
    assert.match(html, /SMTP está configurado correctamente/);
  });
});
