import { AlertController } from '@ionic/angular';
import { confirmarAccionDestructiva } from './confirmacion-alerta.util';

describe('confirmacion-alerta.util', () => {
  it('devuelve true cuando el usuario confirma', async () => {
    let handlerConfirmar: (() => void) | undefined;
    const present = jasmine.createSpy('present').and.resolveTo();
    const onDidDismiss = jasmine.createSpy('onDidDismiss').and.resolveTo({ role: undefined, data: undefined });
    const create = jasmine.createSpy('create').and.callFake(async (opts: { buttons: { handler?: () => void }[] }) => {
      handlerConfirmar = opts.buttons[1]?.handler;
      return { present, onDidDismiss };
    });
    const alertCtrl = { create } as unknown as AlertController;

    const promesa = confirmarAccionDestructiva(alertCtrl, {
      header: 'Confirmar',
      message: '¿Borrar?'
    });
    handlerConfirmar?.();
    await onDidDismiss();
    const resultado = await promesa;

    expect(resultado).toBeTrue();
    expect(present).toHaveBeenCalled();
  });

  it('devuelve false cuando el usuario cancela', async () => {
    const present = jasmine.createSpy('present').and.resolveTo();
    const onDidDismiss = jasmine.createSpy('onDidDismiss').and.resolveTo({ role: 'cancel' });
    const create = jasmine.createSpy('create').and.resolveTo({ present, onDidDismiss });
    const alertCtrl = { create } as unknown as AlertController;

    const resultado = await confirmarAccionDestructiva(alertCtrl, {
      header: 'Confirmar',
      message: '¿Borrar?'
    });

    expect(resultado).toBeFalse();
  });
});
