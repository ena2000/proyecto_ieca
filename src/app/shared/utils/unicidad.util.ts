import { Ministerio, Usuario } from '../../core/models';

export function normalizarTextoUnico(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizarEmailUnico(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function ministerioNombreDuplicado(
  nombre: string,
  ministerios: Ministerio[],
  excludeId?: number | null
): Ministerio | null {
  const clave = normalizarTextoUnico(nombre);
  if (!clave) return null;

  return (
    ministerios.find(m => {
      if (excludeId != null && Number(m.id) === Number(excludeId)) return false;
      return normalizarTextoUnico(m.nombre) === clave;
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
  return `Ya existe un ministerio con el nombre "${ministerio.nombre}".`;
}

export function mensajeUsuarioEmailDuplicado(usuario: Usuario): string {
  return `Ya existe un usuario con el email "${usuario.email}".`;
}
