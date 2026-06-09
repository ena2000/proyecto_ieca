import {
  aplicarResponsableSesion,
  etiquetaResponsableMovimiento
} from './movimiento-responsable.util';
import { SessionUser, Usuario } from '../../core/models';

describe('movimiento-responsable.util', () => {
  const usuarios: Usuario[] = [
    { id: 1, nombre: 'Admin IECA', email: 'admin@ieca.com' },
    { id: 5, nombre: 'Líder Niños', email: 'lider@ieca.com', ministerioId: 3 }
  ];

  const sessionAdmin: SessionUser = {
    id: '1',
    usuario: 'admin',
    rol: 'Administrador'
  };

  const sessionLider: SessionUser = {
    id: '5',
    usuario: 'lider.ninos',
    rol: 'Lider/CoLider',
    ministerioId: 3
  };

  it('asigna el usuario de sesión en un alta', () => {
    const result = aplicarResponsableSesion(
      {} as { usuarioId?: number; registradoPor?: string },
      sessionLider,
      usuarios,
      false
    );
    expect(result.usuarioId).toBe(5);
    expect(result.registradoPor).toBe('Líder Niños');
  });

  it('conserva el responsable original en edición', () => {
    const result = aplicarResponsableSesion(
      { usuarioId: 5, registradoPor: 'Líder Niños' },
      sessionAdmin,
      usuarios,
      true
    );
    expect(result.usuarioId).toBe(5);
    expect(result.registradoPor).toBe('Líder Niños');
  });

  it('muestra la etiqueta del usuario en sesión', () => {
    expect(
      etiquetaResponsableMovimiento({ usuarioId: 5 }, usuarios, sessionAdmin)
    ).toBe('Líder Niños');
  });
});
