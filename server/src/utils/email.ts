const nodemailer = require('nodemailer');
const { brevoConfigured, smtpConfigured, isProduction } = require('../config/env');
const { sendViaBrevo } = require('./email-api');
const {
  getLogoAttachment,
  buildPasswordResetEmail,
  buildOperationalDigestEmail
} = require('./email-templates');

let transporter = null;
let transporterVerified = false;

function crearErrorEmail(message, status = 503) {
  const err = new Error(message);
  err.status = status;
  return err;
}

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
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 12_000,
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 12_000,
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 20_000,
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
    const verifyTimeoutMs = Number(process.env.SMTP_VERIFY_TIMEOUT_MS) || 8_000;
    try {
      await Promise.race([
        transport.verify(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('SMTP verify timeout')), verifyTimeoutMs);
        })
      ]);
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
    throw crearErrorEmail('No hay destinatarios para el correo.', 400);
  }

  const payload = {
    from: smtpFromAddress(),
    to: recipients.join(', '),
    subject,
    text,
    html,
    attachments: mailAttachments()
  };

  if (brevoConfigured) {
    try {
      return await sendViaBrevo({ to: recipients, subject, text, html });
    } catch (err) {
      console.error('[email] Error Brevo:', err?.message || err);
      if (!smtpConfigured) {
        throw err;
      }
      console.warn('[email] Brevo falló; intentando SMTP…');
    }
  }

  if (smtpConfigured) {
    try {
      const transport = await ensureTransporterReady();
      await transport.sendMail(payload);
      return { sent: true, channel: 'email', recipients: recipients.length };
    } catch (err) {
      console.error('[email] Error SMTP:', err);
      if (err?.code === 'EAUTH') {
        transporter = null;
        transporterVerified = false;
      }
      throw crearErrorEmail(smtpErrorMessage(err));
    }
  }

  if (!isProduction) {
    console.log('\n[DEV] Correo IECA (sin Brevo ni SMTP)\n');
    console.log(`Para: ${recipients.join(', ')}`);
    console.log(`Asunto: ${subject}\n`);
    console.log(text);
    console.log('');
    return { sent: false, channel: 'console', recipients: recipients.length };
  }

  throw crearErrorEmail(
    'El correo no está activo. Configura BREVO_API_KEY (Render Free) o SMTP_HOST, SMTP_USER y SMTP_PASS en Render.'
  );
}

/**
 * Envía código de recuperación por email. Sin SMTP en desarrollo: consola + devCode.
 */
async function sendPasswordResetEmail({ to, usuario, code }) {
  const { subject, text, html } = buildPasswordResetEmail({ usuario, code });

  if (brevoConfigured || smtpConfigured) {
    try {
      await deliverEmail({ to, subject, text, html });
      return { sent: true, channel: brevoConfigured ? 'brevo' : 'email', devCode: undefined };
    } catch (err) {
      if (!isProduction) {
        console.warn(
          '[email] SMTP falló en desarrollo; mostrando código en consola/pantalla:',
          err?.message || err
        );
        console.log(`\n[DEV] Código de recuperación para ${usuario} (${to}): ${code}\n`);
        return { sent: false, channel: 'console', devCode: code };
      }
      throw err;
    }
  }

  if (!isProduction) {
    console.log(`\n[DEV] Código de recuperación para ${usuario} (${to}): ${code}\n`);
    return { sent: false, channel: 'console', devCode: code };
  }

  throw crearErrorEmail(
    'El correo no está activo. Configura BREVO_API_KEY (Render Free) o SMTP_HOST, SMTP_USER y SMTP_PASS en Render.'
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
