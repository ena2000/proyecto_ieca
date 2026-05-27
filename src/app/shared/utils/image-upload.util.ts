const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES  = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_WIDTH      = 800;

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validarArchivoImagen(file: File): ImageValidationResult {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Solo se permiten imágenes JPG, PNG o WebP.'
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      valid: false,
      error: 'La imagen no debe superar 5 MB.'
    };
  }
  return { valid: true };
}

export function comprimirImagen(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width  = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width   = MAX_WIDTH;
        }

        canvas.width  = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('No se pudo cargar el archivo.'));
    reader.readAsDataURL(file);
  });
}
