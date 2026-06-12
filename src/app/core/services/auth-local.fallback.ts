import { SessionUser } from '../models';
import { ROLES } from '../constants/roles.constants';

export interface LocalLoginResult {
  success: boolean;
  mensaje?: string;
}

interface HardcodedUser {
  usuario: string;
  password: string;
  id: string;
  rol: typeof ROLES.ADMIN | typeof ROLES.CONTABLE | typeof ROLES.COLABORADOR;
  email: string;
  ministerioId?: number;
}

/** Solo desarrollo: credenciales de demo cuando useLocalFallback = true */
const HARDCODED_USERS: HardcodedUser[] = [
  {
    usuario: 'admin',
    password: '123456',
    id: '1',
    rol: ROLES.ADMIN,
    email: 'admin@ieca.com'
  },
  {
    usuario: 'contable',
    password: '123456',
    id: '2',
    rol: ROLES.CONTABLE,
    email: 'contable@ieca.com'
  },
  {
    usuario: 'colaborador',
    password: '123456',
    id: '3',
    rol: ROLES.COLABORADOR,
    email: 'colaborador@ieca.com',
    ministerioId: 1
  }
];

/**
 * Login offline para desarrollo/demo sin backend.
 * Este archivo se reemplaza por auth-local.fallback.prod.ts en builds de producción.
 */
export function loginLocalFallback(
  usuario: string,
  password: string,
  persistSession: (token: string, refreshToken: string, user: SessionUser) => void
): Promise<LocalLoginResult> {
  return new Promise(resolve => {
    setTimeout(() => {
      const found = HARDCODED_USERS.find(
        u => u.usuario === usuario && u.password === password
      );

      if (!found) {
        resolve({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
        return;
      }

      const session: SessionUser = {
        id: found.id,
        usuario: found.usuario,
        email: found.email,
        rol: found.rol,
        ministerioId: found.ministerioId
      };

      persistSession(
        `token_${found.id}_${Date.now()}`,
        `refresh_${found.id}_${Date.now()}`,
        session
      );
      resolve({ success: true });
    }, 800);
  });
}
