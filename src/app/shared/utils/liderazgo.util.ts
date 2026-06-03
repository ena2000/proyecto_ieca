import { Ministerio, Usuario } from '../../core/models';
import { ROLES } from '../../core/constants/roles.constants';

export const ROL_LIDER = ROLES.LIDER;

export function isRolSinMinisterio(rol?: string): boolean {
  return rol === ROLES.ADMIN || rol === ROLES.CONTABLE;
}

export function usuarioEnOtroMinisterio(
  ministerios: Ministerio[],
  userId: number,
  excluirMinisterioId?: number | null
): Ministerio | null {
  return (
    ministerios.find(
      m =>
        (excluirMinisterioId == null || Number(m.id) !== Number(excluirMinisterioId)) &&
        (Number(m.hldrId) === userId || Number(m.coLiderId) === userId)
    ) ?? null
  );
}

export function usuarioVinculadoAOtroMinisterio(
  user: Pick<Usuario, 'ministerioId'>,
  ministerioId?: number | null
): boolean {
  if (user.ministerioId == null) return false;
  if (ministerioId == null) return true;
  return Number(user.ministerioId) !== Number(ministerioId);
}

/** Líder/co-líder del registro del ministerio + usuarios Líder con ese ministerioId. */
export function idsLideresEnMinisterio(
  min: Ministerio,
  usuarios: Usuario[],
  excluirUsuarioId?: number | null
): Set<number> {
  const ids = new Set<number>();
  if (min.hldrId != null) ids.add(Number(min.hldrId));
  if (min.coLiderId != null) ids.add(Number(min.coLiderId));
  for (const u of usuarios) {
    if (u.rol !== ROL_LIDER) continue;
    if (Number(u.ministerioId) !== Number(min.id)) continue;
    if (excluirUsuarioId != null && Number(u.id) === Number(excluirUsuarioId)) continue;
    ids.add(Number(u.id));
  }
  return ids;
}

export function ministerioTieneCupoLider(
  min: Ministerio,
  usuarios: Usuario[],
  excluirUsuarioId?: number | null
): boolean {
  return idsLideresEnMinisterio(min, usuarios, excluirUsuarioId).size < 2;
}

export function mensajeCupoMinisterioLleno(nombre: string): string {
  return (
    `El ministerio "${nombre}" ya tiene un líder y un co-líder (máximo 2). ` +
    'Asígnalos en Ministerios o libera un cupo antes de agregar otro.'
  );
}

export function validarUsuarioForm(
  usuario: Pick<Usuario, 'rol' | 'ministerioId'>,
  ministerios: Ministerio[],
  usuarios: Usuario[],
  usuarioId?: number | null
): string | null {
  if (isRolSinMinisterio(usuario.rol)) {
    return null;
  }
  if (usuario.rol !== ROL_LIDER) {
    return null;
  }
  if (usuario.ministerioId == null) {
    return 'El rol Líder/CoLíder debe tener un ministerio asignado.';
  }

  const ministerioId = Number(usuario.ministerioId);
  const min = ministerios.find(m => Number(m.id) === ministerioId);
  if (!min) {
    return 'Ministerio no válido.';
  }

  if (usuarioId != null) {
    const uid = Number(usuarioId);
    const conflicto = usuarioEnOtroMinisterio(ministerios, uid, ministerioId);
    if (conflicto) {
      return `Este usuario ya es líder o co-líder de "${conflicto.nombre}". Solo puede pertenecer a un ministerio.`;
    }
    const ids = idsLideresEnMinisterio(min, usuarios, uid);
    if (ids.has(uid) || ids.size < 2) {
      return null;
    }
    return mensajeCupoMinisterioLleno(min.nombre);
  }

  if (!ministerioTieneCupoLider(min, usuarios)) {
    return mensajeCupoMinisterioLleno(min.nombre);
  }
  return null;
}

export function validarMinisterioForm(
  ministerio: Pick<Ministerio, 'hldrId' | 'coLiderId'>,
  usuarios: Usuario[],
  ministerios: Ministerio[],
  ministerioId?: number | null
): string | null {
  const hldrId = ministerio.hldrId != null ? Number(ministerio.hldrId) : null;
  const coLiderId = ministerio.coLiderId != null ? Number(ministerio.coLiderId) : null;

  if (hldrId != null && coLiderId != null && hldrId === coLiderId) {
    return 'El líder y el co-líder deben ser personas distintas.';
  }

  const revisar = (userId: number | null, etiqueta: string): string | null => {
    if (userId == null) return null;
    const user = usuarios.find(u => Number(u.id) === userId);
    if (!user) return `Usuario no válido como ${etiqueta}.`;
    if (user.rol !== ROL_LIDER) {
      return `${user.nombre} debe tener rol Líder/CoLíder.`;
    }
    const conflicto = usuarioEnOtroMinisterio(ministerios, userId, ministerioId);
    if (conflicto) {
      return `${user.nombre} ya es líder o co-líder de "${conflicto.nombre}". Solo puede pertenecer a un ministerio.`;
    }
    if (usuarioVinculadoAOtroMinisterio(user, ministerioId)) {
      return `${user.nombre} ya está vinculado a otro ministerio en Usuarios.`;
    }
    return null;
  };

  return revisar(hldrId, 'líder') ?? revisar(coLiderId, 'co-líder');
}

export function usuariosElegiblesParaMinisterio(
  usuarios: Usuario[],
  ministerios: Ministerio[],
  ministerioId?: number | null,
  opciones?: { excluirUserIds?: Array<number | undefined | null>; mantenerUserIds?: Array<number | undefined | null> }
): Usuario[] {
  const mantener = new Set(
    (opciones?.mantenerUserIds ?? []).filter((id): id is number => id != null).map(Number)
  );
  const excluir = new Set(
    (opciones?.excluirUserIds ?? []).filter((id): id is number => id != null).map(Number)
  );

  return usuarios.filter(u => {
    if (u.rol !== ROL_LIDER || u.estado === 'Inactivo') return false;
    const id = Number(u.id);
    if (mantener.has(id)) return true;
    if (excluir.has(id)) return false;
    if (usuarioEnOtroMinisterio(ministerios, id, ministerioId)) return false;
    if (usuarioVinculadoAOtroMinisterio(u, ministerioId)) return false;
    return true;
  });
}

export function ministeriosConCupoParaLider(
  ministerios: Ministerio[],
  usuarios: Usuario[],
  usuarioId?: number | null,
  ministerioSeleccionado?: number | null
): Ministerio[] {
  return ministerios.filter(m => {
    if (
      ministerioSeleccionado != null &&
      Number(m.id) === Number(ministerioSeleccionado)
    ) {
      return true;
    }
    if (usuarioId != null) {
      const ids = idsLideresEnMinisterio(m, usuarios, usuarioId);
      if (ids.has(Number(usuarioId))) return true;
    }
    return ministerioTieneCupoLider(m, usuarios, usuarioId ?? undefined);
  });
}

/** @deprecated Use usuariosElegiblesParaMinisterio */
export function usuariosElegiblesComoLider(usuarios: Usuario[]): Usuario[] {
  return usuarios.filter(u => u.rol === ROL_LIDER && u.estado !== 'Inactivo');
}
