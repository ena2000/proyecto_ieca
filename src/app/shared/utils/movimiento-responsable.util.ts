import { SessionUser, Usuario } from '../../core/models';

export function resolverUsuarioIdSesion(session: SessionUser | null | undefined): number | undefined {
  const raw = session?.id;
  if (raw == null || raw === '') return undefined;
  const id = Number(raw);
  return Number.isNaN(id) ? undefined : id;
}

export function resolverNombreUsuario(
  usuarioId: number | undefined,
  usuarios: Usuario[]
): string | undefined {
  if (usuarioId == null) return undefined;
  return usuarios.find(u => Number(u.id) === Number(usuarioId))?.nombre;
}

/** Etiqueta visible del responsable (sesión o registro en edición). */
export function etiquetaResponsableMovimiento(
  movimiento: { usuarioId?: number; registradoPor?: string },
  usuarios: Usuario[],
  session: SessionUser | null | undefined
): string {
  const porId = resolverNombreUsuario(movimiento.usuarioId, usuarios);
  if (porId?.trim()) return porId.trim();
  if (movimiento.registradoPor?.trim() && movimiento.registradoPor !== 'Sistema') {
    return movimiento.registradoPor.trim();
  }
  return session?.usuario?.trim() || 'Usuario en sesión';
}

/**
 * Asigna el responsable al usuario autenticado en altas.
 * En edición conserva el responsable original del movimiento.
 */
export function aplicarResponsableSesion<T extends {
  usuarioId?: number;
  registradoPor?: string;
}>(
  movimiento: T,
  session: SessionUser | null | undefined,
  usuarios: Usuario[],
  modoEdicion: boolean
): T {
  if (modoEdicion && movimiento.usuarioId != null) {
    const nombre = resolverNombreUsuario(movimiento.usuarioId, usuarios);
    return {
      ...movimiento,
      registradoPor: nombre ?? movimiento.registradoPor ?? session?.usuario ?? 'Sistema'
    };
  }

  const usuarioId = resolverUsuarioIdSesion(session);
  if (usuarioId == null) return movimiento;

  const nombre = resolverNombreUsuario(usuarioId, usuarios) ?? session?.usuario ?? 'Usuario en sesión';
  return {
    ...movimiento,
    usuarioId,
    registradoPor: nombre
  };
}
