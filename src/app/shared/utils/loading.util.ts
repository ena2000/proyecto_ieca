import { LoadingController } from '@ionic/angular';
import { getHttpErrorMessage } from './error-message.util';

export async function withLoading(
  loadingCtrl: LoadingController,
  message: string,
  task: () => Promise<void>
): Promise<void> {
  const loading = await loadingCtrl.create({
    message,
    spinner: 'circles',
    cssClass: 'ieca-loading'
  });
  await loading.present();
  try {
    await task();
  } finally {
    await loading.dismiss().catch(() => undefined);
  }
}

/** Igual que withLoading pero devuelve el resultado y propaga errores tras cerrar el spinner. */
export async function withLoadingResult<T>(
  loadingCtrl: LoadingController,
  message: string,
  task: () => Promise<T>
): Promise<T> {
  const loading = await loadingCtrl.create({
    message,
    spinner: 'circles',
    cssClass: 'ieca-loading'
  });
  await loading.present();
  try {
    return await task();
  } finally {
    await loading.dismiss().catch(() => undefined);
  }
}

export { getHttpErrorMessage };
