import { LoadingController } from '@ionic/angular';

export async function withLoading(
  loadingCtrl: LoadingController,
  message: string,
  task: () => Promise<void>
): Promise<void> {
  const loading = await loadingCtrl.create({ message, spinner: 'circles' });
  await loading.present();
  try {
    await task();
  } finally {
    await loading.dismiss();
  }
}
