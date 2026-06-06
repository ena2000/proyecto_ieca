/**
 * Genera logo optimizado para correos (Outlook bloquea PNG enormes en base64).
 * Fuente: src/assets/icon/logo_ieca2.png
 */
const fs = require('fs');
const path = require('path');

const sources = [
  path.join(__dirname, '../../src/assets/icon/logo_ieca2.png'),
  path.join(__dirname, '../../src/assets/icon/logo_ieca.png')
];
const targetDir = path.join(__dirname, '../assets/email');
const targetEmail = path.join(targetDir, 'logo_ieca2_email.png');
const targetCopy = path.join(targetDir, 'logo_ieca2.png');

async function main() {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const source = sources.find((p) => fs.existsSync(p));
  if (!source) {
    console.warn('[copy-email-logo] No se encontró logo en src/assets/icon/ — correos usarán fallback IECA.');
    return;
  }

  try {
    const sharp = require('sharp');
    await sharp(source)
      .resize(144, 144, { fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true })
      .toFile(targetEmail);

    const kb = (fs.statSync(targetEmail).size / 1024).toFixed(1);
    console.log(`[copy-email-logo] Logo email (${kb} KB): ${targetEmail}`);
  } catch (err) {
    console.warn('[copy-email-logo] sharp no disponible, copiando PNG original:', err?.message || err);
    fs.copyFileSync(source, targetCopy);
    console.log(`[copy-email-logo] Logo copiado: ${targetCopy}`);
  }
}

main().catch((err) => {
  console.error('[copy-email-logo]', err);
  process.exit(1);
});
