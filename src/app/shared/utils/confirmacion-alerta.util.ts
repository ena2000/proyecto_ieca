import { AlertController } from '@ionic/angular';

/** Diálogo Ionic «Confirmar eliminación» (Cancelar / Eliminar). */
export async function confirmarAccionDestructiva(
  alertCtrl: AlertController,
  opciones: { header: string; message: string; confirmarTexto?: string }
): Promise<boolean> {
  let confirmado = false;
  const alert = await alertCtrl.create({
    header: opciones.header,
    message: opciones.message,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: opciones.confirmarTexto ?? 'Eliminar',
        role: 'destructive',
        handler: () => {
          confirmado = true;
        }
      }
    ]
  });
  await alert.present();
  await alert.onDidDismiss();
  return confirmado;
}
