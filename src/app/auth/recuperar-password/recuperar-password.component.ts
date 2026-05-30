import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule, LoadingController, NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { getHttpErrorMessage } from '../../shared/utils/error-message.util';

type Paso = 'solicitar' | 'restablecer';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar-password.component.html',
  styleUrls: ['./recuperar-password.component.scss']
})
export class RecuperarPasswordComponent {
  paso: Paso = 'solicitar';
  usuarioSolicitado = '';
  devCodeHint: string | null = null;

  solicitarForm: FormGroup;
  restablecerForm: FormGroup;
  showNew = false;
  showConfirm = false;
  isLoading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly loadingCtrl: LoadingController,
    private readonly toastCtrl: ToastController,
    private readonly navCtrl: NavController
  ) {
    this.solicitarForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.restablecerForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get mismatch(): boolean {
    const n = String(this.restablecerForm.value.newPassword ?? '');
    const c = String(this.restablecerForm.value.confirmPassword ?? '');
    return !!n && !!c && n !== c;
  }

  async solicitarCodigo(): Promise<void> {
    if (this.solicitarForm.invalid) {
      this.solicitarForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Enviando código...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      const usuario = String(this.solicitarForm.value.usuario).trim();
      const res = await this.auth.forgotPassword(usuario);
      this.usuarioSolicitado = usuario;
      this.devCodeHint = res.devCode ?? null;
      this.paso = 'restablecer';
      await this.toast(res.message, 'success');
    } catch (err) {
      await this.toast(getHttpErrorMessage(err, 'No se pudo enviar el código'), 'danger');
    } finally {
      await loading.dismiss().catch(() => undefined);
      this.isLoading = false;
    }
  }

  async restablecer(): Promise<void> {
    if (this.restablecerForm.invalid || this.mismatch) {
      this.restablecerForm.markAllAsTouched();
      if (this.mismatch) {
        await this.toast('Las contraseñas no coinciden.', 'danger');
      }
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Actualizando contraseña...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      const { code, newPassword } = this.restablecerForm.value;
      const res = await this.auth.resetPassword(this.usuarioSolicitado, code, newPassword);
      await this.toast(res.message, 'success');
      await this.navCtrl.navigateRoot('/login', { animated: false });
    } catch (err) {
      await this.toast(getHttpErrorMessage(err, 'No se pudo restablecer la contraseña'), 'danger');
    } finally {
      await loading.dismiss().catch(() => undefined);
      this.isLoading = false;
    }
  }

  volverASolicitar(): void {
    this.paso = 'solicitar';
    this.devCodeHint = null;
    this.restablecerForm.reset();
  }

  private async toast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({
      message,
      duration: 3200,
      color,
      position: 'top'
    });
    await t.present();
  }
}
