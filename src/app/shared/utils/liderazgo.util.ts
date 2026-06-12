import { Ministerio, Usuario } from '../../core/models';
import {
  ROLES,
  AppRole,
  esColaboradorMinisterio,
  normalizarRol
} from '../../core/constants/roles.constants';

export const ROL_COLABORADOR = ROLES.COLABORADOR;

/** @deprecated Use ROL_COLABORADOR */
export const ROL_LIDER = ROLES.COLABORADOR;

export function isRolSinMinisterio(rol?: string): boolean {
  return rol === ROLES.ADMIN || rol === ROLES.CONTABLE;
}

export function esRolColaborador(rol?: string | null): boolean {
  return esColaboradorMinisterio(rol);
}

export function colaboradoresEnMinisterio(
  ministerioId: number,
  usuarios: Usuario[]
): Usuario[] {
  return usuarios.filter(
    u =>
      esColaboradorMinisterio(u.rol) &&
      u.estado !== 'Inactivo' &&
      Number(u.ministerioId) === Number(ministerioId)
  );
}

export function nombresColaboradoresMinisterio(
  ministerioId: number,
  usuarios: Usuario[],
  min?: Pick<Ministerio, 'hldrId' | 'coLiderId'>
): string {
  const nombres = new Set<string>();

  for (const u of colaboradoresEnMinisterio(ministerioId, usuarios)) {
    const nombre = u.nombre?.trim();
    if (nombre) nombres.add(nombre);
  }

  if (min) {
    for (const userId of [min.hldrId, min.coLiderId]) {
      if (userId == null) continue;
      const legacy = usuarios.find(u => Number(u.id) === Number(userId));
      const nombre = legacy?.nombre?.trim();
      if (nombre) nombres.add(nombre);
    }
  }

  return nombres.size ? [...nombres].join(', ') : '—';
}

export function validarUsuarioForm(
  usuario: Pick<Usuario, 'rol' | 'ministerioId'>,
  ministerios: Ministerio[],
  _usuarios: Usuario[],
  _usuarioId?: number | null
): string | null {
  const rol = normalizarRol(usuario.rol);
  const rolesValidos: AppRole[] = [ROLES.ADMIN, ROLES.CONTABLE, ROLES.COLABORADOR];
  if (!rol || !rolesValidos.includes(rol)) {
    return 'Selecciona un rol válido.';
  }
  if (isRolSinMinisterio(rol)) {
    return null;
  }
  if (usuario.ministerioId == null) {
    return null;
  }

  const ministerioId = Number(usuario.ministerioId);
  const min = ministerios.find(m => Number(m.id) === ministerioId);
  if (!min) {
    return 'Ministerio no válido.';
  }
  return null;
}

/** Los colaboradores se asignan en Usuarios; el formulario de ministerio ya no valida líderes. */
export function validarMinisterioForm(
  _ministerio: Pick<Ministerio, 'hldrId' | 'coLiderId'>,
  _usuarios: Usuario[],
  _ministerios: Ministerio[],
  _ministerioId?: number | null
): string | null {
  return null;
}

export function ministeriosParaColaborador(
  ministerios: Ministerio[],
  _usuarios: Usuario[],
  _usuarioId?: number | null,
  _ministerioSeleccionado?: number | null
): Ministerio[] {
  return ministerios.filter(m => m.estado !== 'Inactivo');
}

/** @deprecated Use ministeriosParaColaborador */
export function ministeriosConCupoParaLider(
  ministerios: Ministerio[],
  usuarios: Usuario[],
  usuarioId?: number | null,
  ministerioSeleccionado?: number | null
): Ministerio[] {
  return ministeriosParaColaborador(ministerios, usuarios, usuarioId, ministerioSeleccionado);
}

/** @deprecated Use colaboradoresEnMinisterio */
export function usuariosElegiblesParaMinisterio(
  usuarios: Usuario[],
  _ministerios: Ministerio[],
  _ministerioId?: number | null,
  _opciones?: { excluirUserIds?: Array<number | undefined | null>; mantenerUserIds?: Array<number | undefined | null> }
): Usuario[] {
  return usuarios.filter(u => esColaboradorMinisterio(u.rol) && u.estado !== 'Inactivo');
}
