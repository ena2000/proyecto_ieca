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

export function validarUsuarioForm(
  usuario: Pick<Usuario, 'rol' | 'ministerioId'>,
  ministerios: Ministerio[],
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
  if (usuarioId != null) {
    const conflicto = usuarioEnOtroMinisterio(ministerios, usuarioId, usuario.ministerioId);
    if (conflicto) {
      return `Este usuario ya es líder o co-líder de "${conflicto.nombre}".`;
    }
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
      return `${user.nombre} ya es líder o co-líder de "${conflicto.nombre}".`;
    }
    if (
      user.ministerioId != null &&
      ministerioId != null &&
      Number(user.ministerioId) !== Number(ministerioId)
    ) {
      return `${user.nombre} está vinculado a otro ministerio en Usuarios.`;
    }
    return null;
  };

  return revisar(hldrId, 'líder') ?? revisar(coLiderId, 'co-líder');
}

export function usuariosElegiblesComoLider(usuarios: Usuario[]): Usuario[] {
  return usuarios.filter(u => u.rol === ROL_LIDER && u.estado !== 'Inactivo');
}
