import { comprimirImagen, validarArchivoImagen } from './image-upload.util';

const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB
const PDF_TYPE = 'application/pdf';

export type ComprobanteTipo = 'imagen' | 'pdf';

export interface ComprobanteValidationResult {
  valid: boolean;
  error?: string;
  tipo?: ComprobanteTipo;
}

export function esComprobantePdf(dataUrl: string | null | undefined): boolean {
  if (!dataUrl) return false;
  return dataUrl.startsWith('data:application/pdf');
}

export function esComprobanteImagen(dataUrl: string | null | undefined): boolean {
  if (!dataUrl) return false;
  return dataUrl.startsWith('data:image/');
}

export function validarComprobante(file: File): ComprobanteValidationResult {
  if (file.type === PDF_TYPE || file.name.toLowerCase().endsWith('.pdf')) {
    if (file.size > MAX_PDF_BYTES) {
      return { valid: false, error: 'El PDF no debe superar 5 MB.' };
    }
    return { valid: true, tipo: 'pdf' };
  }

  const img = validarArchivoImagen(file);
  if (img.valid) {
    return { valid: true, tipo: 'imagen' };
  }
  return {
    valid: false,
    error: 'Solo se permiten imágenes JPG, PNG, WebP o archivos PDF.'
  };
}

function leerDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

/** Comprime imágenes; los PDF se guardan como data URL sin transformar. */
export async function procesarComprobante(
  file: File
): Promise<{ dataUrl: string; tipo: ComprobanteTipo }> {
  const validacion = validarComprobante(file);
  if (!validacion.valid || !validacion.tipo) {
    throw new Error(validacion.error ?? 'Archivo no válido.');
  }

  if (validacion.tipo === 'pdf') {
    return { dataUrl: await leerDataUrl(file), tipo: 'pdf' };
  }

  return { dataUrl: await comprimirImagen(file), tipo: 'imagen' };
}
