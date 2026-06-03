import { ToastController } from '@ionic/angular';

/** Toast unificado para la app web (escritorio / navegador). */
export async function presentIecaToast(
  toastCtrl: ToastController,
  message: string,
  color: string,
  duration = 2600
): Promise<void> {
  const toast = await toastCtrl.create({
    message,
    duration,
    color,
    position: 'top',
    cssClass: 'ieca-toast',
    ...(message.length > 72
      ? { buttons: [{ text: 'Cerrar', role: 'cancel' }] }
      : {})
  });
  await toast.present();
}
