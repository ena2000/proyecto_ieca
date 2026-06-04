const nodemailer = require('nodemailer');
const { smtpConfigured, isProduction } = require('../config/env');
const {
  getLogoAttachment,
  buildPasswordResetEmail,
  buildOperationalDigestEmail
} = require('./email-templates');

let transporter = null;
let transporterVerified = false;

function smtpErrorMessage(err) {
  const code = err?.code || '';
  if (code === 'EAUTH') {
    return (
      'No se pudo autenticar con el servidor de correo. ' +
      'Revisa SMTP_USER, SMTP_PASS y (en Outlook) usa contraseña de aplicación.'
    );
  }
  if (code === 'ECONNECTION' || code === 'ETIMEDOUT' || code === 'ESOCKET') {
    return (
      'No hay conexión con el servidor SMTP. Revisa SMTP_HOST, SMTP_PORT y SMTP_SECURE en server/.env.'
    );
  }
  return `No se pudo enviar el correo: ${err?.message || 'error desconocido'}`;
}

function getTransporter() {
  if (!smtpConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        minVersion: 'TLSv1.2'
      }
    });
    transporterVerified = false;
  }
  return transporter;
}

async function ensureTransporterReady() {
  const transport = getTransporter();
  if (!transport) return null;
  if (!transporterVerified) {
    try {
      await transport.verify();
    } catch (err) {
      console.warn('[email] Verificación SMTP falló (se intentará enviar igual):', err?.message || err);
    }
    transporterVerified = true;
  }
  return transport;
}

function smtpFromAddress() {
  const raw = process.env.SMTP_FROM || process.env.SMTP_USER || '';
  return String(raw).trim().replace(/^["']|["']$/g, '');
}

function mailAttachments() {
  const logo = getLogoAttachment();
  return logo ? [logo] : [];
}

async function deliverEmail({ to, subject, text, html }) {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) {
    throw new Error('No hay destinatarios para el correo.');
  }

  const payload = {
    from: smtpFromAddress(),
    to: recipients.join(', '),
    subject,
    text,
    html,
    attachments: mailAttachments()
  };

  if (smtpConfigured) {
    try {
      const transport = await ensureTransporterReady();
      await transport.sendMail(payload);
      return { sent: true, channel: 'email', recipients: recipients.length };
    } catch (err) {
      console.error('[email] Error SMTP:', err);
      throw new Error(smtpErrorMessage(err));
    }
  }

  if (!isProduction) {
    console.log('\n[DEV] Correo IECA (sin SMTP)\n');
    console.log(`Para: ${recipients.join(', ')}`);
    console.log(`Asunto: ${subject}\n`);
    console.log(text);
    console.log('');
    return { sent: false, channel: 'console', recipients: recipients.length };
  }

  throw new Error(
    'El envío de correo no está configurado. Configura SMTP en server/.env o contacta al administrador.'
  );
}

/**
 * Envía código de recuperación por email. Sin SMTP en desarrollo: consola + devCode.
 */
async function sendPasswordResetEmail({ to, usuario, code }) {
  const { subject, text, html } = buildPasswordResetEmail({ usuario, code });

  if (smtpConfigured) {
    await deliverEmail({ to, subject, text, html });
    return { sent: true, channel: 'email', devCode: undefined };
  }

  if (!isProduction) {
    console.log(`\n[DEV] Código de recuperación para ${usuario} (${to}): ${code}\n`);
    return { sent: false, channel: 'console', devCode: code };
  }

  throw new Error(
    'El envío de correo no está configurado. Configura SMTP_HOST, SMTP_USER y SMTP_PASS en server/.env.'
  );
}

/**
 * Resumen operativo (pendientes / cierre) a administradores y contables.
 */
async function sendOperationalDigestEmail({ to, subject, text, html, resumen }) {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) {
    return { sent: false, channel: 'none', reason: 'no_recipients' };
  }

  let subjectLine = subject;
  let textBody = text;
  let htmlBody = html;

  if (resumen) {
    const built = buildOperationalDigestEmail(resumen);
    subjectLine = built.subject;
    textBody = built.text;
    htmlBody = built.html;
  }

  subjectLine = subjectLine || 'IECA — Resumen operativo';
  textBody = textBody || 'Resumen operativo IECA.';
  htmlBody = htmlBody || undefined;

  return deliverEmail({
    to: recipients,
    subject: subjectLine,
    text: textBody,
    html: htmlBody
  });
}

module.exports = { sendPasswordResetEmail, sendOperationalDigestEmail, smtpErrorMessage };
