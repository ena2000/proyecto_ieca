import { Ministerio, Usuario } from '../../core/models';

export function normalizarTextoUnico(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prefijos habituales que no cambian la identidad del ministerio
 * ("ministerio de alabanza" ≈ "alabanza").
 */
const PREFIJOS_MINISTERIO = [
  /^el ministerio de(?:l)?\s+/,
  /^ministerio de(?:l)?\s+/,
  /^ministerio\s+/,
  /^area de(?:l)?\s+/,
  /^departamento de(?:l)?\s+/,
  /^depto\.?\s+(?:de\s+)?/,
  /^grupo de(?:l)?\s+/,
  /^equipo de(?:l)?\s+/
];

/** Clave comparable: sin tildes/mayúsculas y sin prefijos tipo «ministerio de». */
export function claveMinisterioNombre(value: unknown): string {
  let clave = normalizarTextoUnico(value);
  if (!clave) return '';

  let changed = true;
  while (changed) {
    changed = false;
    for (const re of PREFIJOS_MINISTERIO) {
      const next = clave.replace(re, '').trim();
      if (next !== clave) {
        clave = next;
        changed = true;
      }
    }
  }
  return clave;
}

export function normalizarEmailUnico(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function ministerioNombreDuplicado(
  nombre: string,
  ministerios: Ministerio[],
  excludeId?: number | null
): Ministerio | null {
  const clave = claveMinisterioNombre(nombre);
  if (!clave) return null;

  return (
    ministerios.find(m => {
      if (excludeId != null && Number(m.id) === Number(excludeId)) return false;
      return claveMinisterioNombre(m.nombre) === clave;
    }) ?? null
  );
}

export function usuarioEmailDuplicado(
  email: string,
  usuarios: Usuario[],
  excludeId?: number | null
): Usuario | null {
  const clave = normalizarEmailUnico(email);
  if (!clave) return null;

  return (
    usuarios.find(u => {
      if (excludeId != null && Number(u.id) === Number(excludeId)) return false;
      return normalizarEmailUnico(u.email) === clave;
    }) ?? null
  );
}

export function usuarioLoginDuplicado(
  usuario: string,
  usuarios: Usuario[],
  excludeId?: number | null
): Usuario | null {
  const clave = normalizarTextoUnico(usuario);
  if (!clave) return null;

  return (
    usuarios.find(u => {
      if (excludeId != null && Number(u.id) === Number(excludeId)) return false;
      return normalizarTextoUnico(u.usuario) === clave;
    }) ?? null
  );
}

export function mensajeMinisterioDuplicado(ministerio: Ministerio): string {
  return `Ya existe un ministerio con el nombre "${ministerio.nombre}" (o uno equivalente).`;
}

export function mensajeUsuarioEmailDuplicado(usuario: Usuario): string {
  return `Ya existe un usuario con el email "${usuario.email}".`;
}
