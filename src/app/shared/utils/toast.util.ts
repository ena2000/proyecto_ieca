import { ToastController } from '@ionic/angular';

type IecaToastVariant = 'success' | 'info' | 'warning' | 'danger';

interface IecaToastMeta {
  variant: IecaToastVariant;
  header: string;
  icon: string;
}

function resolveToastMeta(color: string): IecaToastMeta {
  switch (color) {
    case 'success':
      return { variant: 'success', header: 'Éxito', icon: 'checkmark-circle' };
    case 'danger':
      return { variant: 'danger', header: 'Error', icon: 'shield' };
    case 'warning':
      return { variant: 'warning', header: 'Advertencia', icon: 'warning' };
    default:
      return { variant: 'info', header: 'Información', icon: 'information-circle' };
  }
}

/** Toast unificado para la app web (escritorio / navegador). */
export async function presentIecaToast(
  toastCtrl: ToastController,
  message: string,
  color: string,
  duration = 2600,
  header?: string
): Promise<void> {
  const meta = resolveToastMeta(color);
  const toast = await toastCtrl.create({
    header: header ?? meta.header,
    message,
    duration,
    position: 'top',
    layout: 'baseline',
    icon: meta.icon,
    cssClass: `ieca-toast ieca-toast--${meta.variant}`,
    ...(message.length > 72
      ? { buttons: [{ text: 'Cerrar', role: 'cancel' }] }
      : {})
  });
  await toast.present();
}
