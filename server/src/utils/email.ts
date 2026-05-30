const nodemailer = require('nodemailer');
const { smtpConfigured, isProduction, devResetCodeInResponse } = require('../config/env');
const {
  getLogoAttachment,
  buildPasswordResetEmail,
  buildOperationalDigestEmail
} = require('./email-templates');

let transporter = null;

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
      }
    });
  }
  return transporter;
}

function mailAttachments() {
  const logo = getLogoAttachment();
  return logo ? [logo] : [];
}

async function deliverEmail({ to, subject, text, html }) {
  const transport = getTransporter();
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  const payload = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: recipients.join(', '),
    subject,
    text,
    html,
    attachments: mailAttachments()
  };

  if (transport) {
    await transport.sendMail(payload);
    return { sent: true, channel: 'email', recipients: recipients.length };
  }

  if (!isProduction) {
    console.log('\n[DEV] Correo IECA (sin SMTP)\n');
    console.log(`Para: ${recipients.join(', ')}`);
    console.log(`Asunto: ${subject}\n`);
    console.log(text);
    console.log('');
    return { sent: false, channel: 'console', recipients: recipients.length };
  }

  throw new Error('El envío de correo no está configurado. Contacta al administrador.');
}

/**
 * Envía código de recuperación por email. En dev puede loguear el código.
 */
async function sendPasswordResetEmail({ to, usuario, code }) {
  const { subject, text, html } = buildPasswordResetEmail({ usuario, code });
  const transport = getTransporter();

  if (transport) {
    await deliverEmail({ to, subject, text, html });
    return { sent: true, channel: 'email' };
  }

  if (!isProduction) {
    console.log(`\n[DEV] Código de recuperación para ${usuario} (${to}): ${code}\n`);
    return { sent: false, channel: 'console', devCode: devResetCodeInResponse ? code : undefined };
  }

  throw new Error('El envío de correo no está configurado. Contacta al administrador.');
}

/**
 * Resumen operativo (pendientes / cierre) a administradores y contables.
 * @param {{ to: string|string[], subject?: string, text?: string, html?: string, resumen?: object }} params
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

  const result = await deliverEmail({
    to: recipients,
    subject: subjectLine,
    text: textBody,
    html: htmlBody
  });

  return result;
}

module.exports = { sendPasswordResetEmail, sendOperationalDigestEmail };
