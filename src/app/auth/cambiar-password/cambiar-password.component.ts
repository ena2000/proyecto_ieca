import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './cambiar-password.component.html',
  styleUrls: ['./cambiar-password.component.scss']
})
export class CambiarPasswordComponent implements OnInit {
  form!: FormGroup;
  showOld = false;
  showNew = false;
  showConfirm = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly loadingCtrl: LoadingController,
    private readonly toastCtrl: ToastController,
    private readonly navCtrl: NavController
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get mismatch(): boolean {
    const n = String(this.form.value.newPassword ?? '');
    const c = String(this.form.value.confirmPassword ?? '');
    return !!n && !!c && n !== c;
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.mismatch) {
      this.form.markAllAsTouched();
      await this.toast('Revisa los campos. Las contraseñas deben coincidir.', 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Actualizando contraseña...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      await this.auth.changePassword(this.form.value.oldPassword, this.form.value.newPassword);
      await loading.dismiss();
      await this.toast('Contraseña actualizada. ¡Listo!', 'success');
      await this.navCtrl.navigateRoot(this.auth.getRutaPorDefecto(), { animated: false });
    } catch (err) {
      await loading.dismiss();
      const msg = err instanceof Error ? err.message : 'No se pudo cambiar la contraseña';
      await this.toast(msg, 'danger');
    }
  }

  private async toast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}

