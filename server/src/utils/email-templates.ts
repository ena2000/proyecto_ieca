const fs = require('fs');
const path = require('path');
const { formatearMontoGtq } = require('./resumen-operativo');

const BRAND = {
  red: '#e42021',
  purple: '#66318d',
  blue: '#2e358f',
  blueLight: '#3b448b',
  yellow: '#f4e530',
  charcoal: '#353432',
  green: '#10b981',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
  bg: '#f4f7fb',
  surface: '#ffffff'
};

const LOGO_CID = 'ieca-logo';
const CHURCH_NAME = 'Iglesia del Evangelio Cuadrangular "La Alborada"';
const APP_NAME = 'Gestión Financiera IECA';

function resolveLogoPath() {
  const candidates = [
    process.env.EMAIL_LOGO_PATH?.trim(),
    path.join(__dirname, '../../assets/email/logo_ieca2.png'),
    path.join(__dirname, '../../../src/assets/icon/logo_ieca2.png'),
    path.join(__dirname, '../../../src/assets/icon/logo_ieca.png')
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getLogoAttachment() {
  const logoPath = resolveLogoPath();
  if (!logoPath) return null;
  return {
    filename: path.basename(logoPath),
    path: logoPath,
    cid: LOGO_CID
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatFechaGt(iso) {
  try {
    return new Date(iso).toLocaleString('es-GT', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch {
    return String(iso || '');
  }
}

function appUrl() {
  const raw = process.env.EMAIL_APP_URL?.trim() || process.env.CORS_ORIGINS?.split(',')[0]?.trim();
  return raw || 'http://localhost:4200';
}

function buildLayout({ preheader, title, bodyHtml, footerExtra = '' }) {
  const logoPath = resolveLogoPath();
  const logoBlock = logoPath
    ? `<img src="cid:${LOGO_CID}" alt="IECA" width="72" height="72" style="display:block;margin:0 auto;border:0;outline:none;" />`
    : `<div style="width:72px;height:72px;margin:0 auto;border-radius:50%;background:${BRAND.yellow};color:${BRAND.blue};font-weight:800;font-size:22px;line-height:72px;text-align:center;">IECA</div>`;

  const preheaderText = escapeHtml(preheader || title);

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: light only; supported-color-schemes: light; }
    body, table, td, p, h1, h2, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media (prefers-color-scheme: dark) {
      .ieca-shell, .ieca-body, .ieca-logo-band, .ieca-footer { background-color: ${BRAND.surface} !important; }
      .ieca-title-band { background-color: ${BRAND.blue} !important; }
      .ieca-text { color: ${BRAND.text} !important; }
      .ieca-muted { color: ${BRAND.textMuted} !important; }
      .ieca-title-text, .ieca-subtitle-text { color: #ffffff !important; }
      .ieca-alert-box { background-color: #f0fdf4 !important; color: #166534 !important; border-color: #86efac !important; }
    }
  </style>
  <title>${escapeHtml(title)}</title>
</head>
<body class="ieca-text" style="margin:0;padding:0;background-color:${BRAND.bg};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheaderText}</div>
  <table role="presentation" class="ieca-shell" width="100%" cellspacing="0" cellpadding="0" bgcolor="${BRAND.bg}" style="background-color:${BRAND.bg};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${BRAND.surface}" style="max-width:600px;background-color:${BRAND.surface};border-radius:16px;border:1px solid ${BRAND.border};">
          <tr>
            <td height="5" bgcolor="${BRAND.blue}" style="background-color:${BRAND.blue};font-size:0;line-height:0;border-radius:16px 16px 0 0;">&nbsp;</td>
          </tr>
          <tr>
            <td height="5" bgcolor="${BRAND.purple}" style="background-color:${BRAND.purple};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="ieca-logo-band" align="center" bgcolor="#f8fafc" style="background-color:#f8fafc;padding:24px 24px 16px;border-bottom:1px solid ${BRAND.border};">
              ${logoBlock}
            </td>
          </tr>
          <tr>
            <td class="ieca-title-band" align="center" bgcolor="${BRAND.blue}" style="background-color:${BRAND.blue};padding:16px 24px 20px;">
              <p class="ieca-subtitle-text" style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#e2e8f0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(APP_NAME)}</p>
              <h1 class="ieca-title-text" style="margin:8px 0 0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.35;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td class="ieca-body ieca-text" bgcolor="${BRAND.surface}" style="padding:28px 24px;font-size:15px;line-height:1.6;color:${BRAND.text};background-color:${BRAND.surface};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td class="ieca-footer" bgcolor="#f8fafc" style="padding:16px 24px 24px;font-size:12px;line-height:1.5;color:${BRAND.textMuted};background-color:#f8fafc;border-top:1px solid ${BRAND.border};border-radius:0 0 16px 16px;">
              <p class="ieca-muted" style="margin:0 0 6px;font-weight:600;color:${BRAND.blue};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(CHURCH_NAME)}</p>
              <p class="ieca-muted" style="margin:0 0 8px;color:${BRAND.textMuted};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">Este mensaje fue generado automáticamente. No respondas a este correo.</p>
              ${footerExtra ? `<p class="ieca-muted" style="margin:0;color:${BRAND.textMuted};">${footerExtra}</p>` : ''}
            </td>
          </tr>
        </table>
        <p class="ieca-muted" style="margin:16px 0 0;font-size:11px;color:${BRAND.textMuted};max-width:600px;text-align:center;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
          © ${new Date().getFullYear()} IECA · Sistema de gestión financiera
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPasswordResetEmail({ usuario, code }) {
  const safeUser = escapeHtml(usuario);
  const safeCode = escapeHtml(code);
  const url = escapeHtml(appUrl());

  const bodyHtml = `
    <p style="margin:0 0 16px;color:${BRAND.text};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">Hola <strong style="color:${BRAND.blue};">${safeUser}</strong>,</p>
    <p style="margin:0 0 20px;color:${BRAND.text};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">Recibimos una solicitud para restablecer tu contraseña en <strong style="color:${BRAND.blue};">${escapeHtml(APP_NAME)}</strong>.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;">
      <tr>
        <td align="center" bgcolor="#f8fafc" style="background-color:#f8fafc;border:2px dashed ${BRAND.purple};border-radius:12px;padding:20px;">
          <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.textMuted};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">Tu código temporal</p>
          <p style="margin:0;font-size:32px;font-weight:800;letter-spacing:0.2em;color:${BRAND.blue};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${safeCode}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 12px;font-size:14px;color:${BRAND.textMuted};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">⏱ Válido por <strong style="color:${BRAND.text};">15 minutos</strong>. Si no solicitaste este cambio, ignora este mensaje.</p>
    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td bgcolor="${BRAND.red}" style="background-color:${BRAND.red};border-radius:8px;">
          <a href="${url}/recuperar-password" style="display:inline-block;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">Ir a restablecer contraseña</a>
        </td>
      </tr>
    </table>`;

  const html = buildLayout({
    preheader: `Código ${code} para restablecer tu contraseña`,
    title: 'Restablecer contraseña',
    bodyHtml
  });

  const text =
    `Hola ${usuario},\n\n` +
    `Recibimos una solicitud para restablecer tu contraseña en ${APP_NAME}.\n\n` +
    `Tu código temporal es: ${code}\n\n` +
    `Válido por 15 minutos. Si no solicitaste esto, ignora este mensaje.\n\n` +
    `Restablecer: ${appUrl()}/recuperar-password\n\n` +
    `— ${CHURCH_NAME}`;

  return { html, text, subject: 'IECA — Código para restablecer contraseña' };
}

function buildTestEmail() {
  const bodyHtml = `
    <p style="margin:0 0 16px;color:${BRAND.text};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">Hola,</p>
    <p style="margin:0 0 16px;color:${BRAND.text};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">Este es un <strong style="color:${BRAND.blue};">correo de prueba</strong> del sistema <strong style="color:${BRAND.blue};">${escapeHtml(APP_NAME)}</strong>.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="ieca-alert-box" style="margin:0;">
      <tr>
        <td bgcolor="#f0fdf4" style="padding:14px 16px;background-color:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid ${BRAND.green};border-radius:8px;color:#166534;font-size:14px;line-height:1.5;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
          Si recibes este mensaje, el envío SMTP está configurado correctamente.
        </td>
      </tr>
    </table>`;

  const html = buildLayout({
    preheader: 'Prueba de correo IECA',
    title: 'Prueba de alertas por correo',
    bodyHtml
  });

  const text =
    `Hola,\n\n` +
    `Este es un correo de prueba del sistema ${APP_NAME}.\n` +
    `Si lo recibes, el envío SMTP está configurado correctamente.\n\n` +
    `— ${CHURCH_NAME}`;

  return { html, text, subject: 'IECA — Prueba de alertas por correo' };
}

function pendienteBadge(tipo) {
  const isIngreso = String(tipo).toLowerCase() === 'ingreso';
  const bg = isIngreso ? '#dbeafe' : '#fee2e2';
  const color = isIngreso ? BRAND.blue : BRAND.red;
  const label = isIngreso ? 'INGRESO' : 'GASTO';
  return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:${bg};color:${color};">${label}</span>`;
}

function buildOperationalDigestEmail(resumen) {
  const sections = [];

  if (resumen.pendientes?.length > 0) {
    const rows = resumen.pendientes
      .slice(0, 25)
      .map((p) => {
        const tipoLabel = escapeHtml(String(p.tipo || '').toUpperCase());
        return `<tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};vertical-align:top;">
            ${pendienteBadge(p.tipo)}
            <strong style="margin-left:6px;color:${BRAND.text};">#${escapeHtml(p.id)}</strong>
            <div style="margin-top:6px;color:${BRAND.text};">${escapeHtml(p.descripcion)}</div>
            <div style="margin-top:4px;font-size:13px;color:${BRAND.textMuted};">${escapeHtml(p.ministerio)}</div>
          </td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid ${BRAND.border};white-space:nowrap;font-weight:700;color:${BRAND.blue};">
            ${escapeHtml(formatearMontoGtq(p.monto))}
          </td>
        </tr>`;
      })
      .join('');

  const more =
      resumen.pendientes.length > 25
        ? `<p style="margin:12px 0 0;font-size:13px;color:${BRAND.textMuted};">… y ${resumen.pendientes.length - 25} más en la aplicación.</p>`
        : '';

    sections.push(`
      <h2 style="margin:0 0 12px;font-size:16px;color:${BRAND.blue};">Pendientes de aprobación</h2>
      <p style="margin:0 0 16px;font-size:14px;color:${BRAND.textMuted};">Más de <strong>${resumen.horasPendiente} horas</strong> sin aprobar · <strong>${resumen.pendientes.length}</strong> registro(s)</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
      ${more}`);
  }

  if (resumen.cierre?.activo) {
    sections.push(`
      <div style="margin-top:24px;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
        <h2 style="margin:0 0 8px;font-size:16px;color:${BRAND.charcoal};">Recordatorio de cierre mensual</h2>
        <p style="margin:0 0 8px;font-size:15px;"><strong>${escapeHtml(resumen.cierre.etiquetaMes)}</strong></p>
        <p style="margin:0;font-size:14px;color:${BRAND.textMuted};">Quedan <strong>${resumen.cierre.diasRestantes}</strong> día(s) de calendario en el mes. Ejecuta el cierre en <strong>Administración</strong> cuando los movimientos estén revisados.</p>
      </div>`);
  }

  if (!resumen.tieneContenido) {
    sections.push(
      `<p style="margin:0;color:${BRAND.textMuted};">No hay alertas operativas en este momento.</p>`
    );
  }

  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:14px;color:${BRAND.textMuted};">Generado: ${escapeHtml(formatFechaGt(resumen.generadoEn))}</p>
    ${sections.join('')}
    <p style="margin:24px 0 0;">
      <table role="presentation" cellspacing="0" cellpadding="0">
        <tr>
          <td bgcolor="${BRAND.blue}" style="background-color:${BRAND.blue};border-radius:8px;">
            <a href="${escapeHtml(appUrl())}" style="display:inline-block;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">Abrir la aplicación</a>
          </td>
        </tr>
      </table>
    </p>`;

  const { construirTextoResumen, construirAsuntoResumen } = require('./resumen-operativo');

  return {
    html: buildLayout({
      preheader: construirAsuntoResumen(resumen).replace(/^IECA — /, ''),
      title: 'Resumen operativo',
      bodyHtml
    }),
    text: construirTextoResumen(resumen),
    subject: construirAsuntoResumen(resumen)
  };
}

module.exports = {
  BRAND,
  LOGO_CID,
  resolveLogoPath,
  getLogoAttachment,
  buildPasswordResetEmail,
  buildTestEmail,
  buildOperationalDigestEmail
};
