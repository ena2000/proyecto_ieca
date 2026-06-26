const { inlineLogoForApi } = require('./email-templates');

function crearErrorEmail(message, status = 503) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Parsea "Nombre <correo@ejemplo.com>" o solo correo.
 */
function parseFromAddress() {
  const raw =
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    '';
  const trimmed = String(raw).replace(/^["']|["']$/g, '');
  const match = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim().toLowerCase() };
  }
  if (trimmed.includes('@')) {
    return {
      name: process.env.EMAIL_FROM_NAME?.trim() || 'IECA Finanzas',
      email: trimmed.toLowerCase()
    };
  }
  return { name: 'IECA Finanzas', email: '' };
}

/**
 * Envío por API HTTP (Brevo). Funciona en Render Free (sin puertos SMTP).
 */
async function sendViaBrevo({ to, subject, text, html }) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    throw crearErrorEmail('BREVO_API_KEY no configurada.');
  }

  const sender = parseFromAddress();
  if (!sender.email) {
    throw crearErrorEmail(
      'Configura EMAIL_FROM o SMTP_FROM con un remitente verificado en Brevo.'
    );
  }

  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) {
    throw crearErrorEmail('No hay destinatarios para el correo.', 400);
  }

  const htmlBody = inlineLogoForApi(html);

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      sender,
      to: recipients.map((email) => ({ email })),
      subject,
      htmlContent: htmlBody || undefined,
      textContent: text || undefined
    })
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.message || body?.code || '';
    } catch {
      detail = await res.text().catch(() => '');
    }
    console.error('[email-api] Brevo error:', res.status, detail);
    throw crearErrorEmail(
      `No se pudo enviar el correo (Brevo). Revisa BREVO_API_KEY y que el remitente ${sender.email} esté verificado en Brevo.${detail ? ` (${detail})` : ''}`
    );
  }

  return { sent: true, channel: 'brevo', recipients: recipients.length };
}

module.exports = { sendViaBrevo, parseFromAddress };
