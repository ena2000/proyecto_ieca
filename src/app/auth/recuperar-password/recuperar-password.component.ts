import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { getHttpErrorMessage } from '../../shared/utils/error-message.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import { despertarApiEnSegundoPlano, esperarApiDisponible } from '../../shared/utils/api-wake.util';

type Paso = 'solicitar' | 'restablecer';
type LoadingFase = 'conectando' | 'enviando' | 'actualizando';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar-password.component.html',
  styleUrls: ['./recuperar-password.component.scss']
})
export class RecuperarPasswordComponent implements OnInit {
  paso: Paso = 'solicitar';
  usuarioSolicitado = '';
  devCodeHint: string | null = null;
  emailEnviado = false;

  solicitarForm: FormGroup;
  restablecerForm: FormGroup;
  showNew = false;
  showConfirm = false;
  isLoading = false;
  loadingAccion: 'solicitar' | 'restablecer' | null = null;
  loadingFase: LoadingFase | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
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

  ngOnInit(): void {
    despertarApiEnSegundoPlano();
  }

  get mismatch(): boolean {
    const n = String(this.restablecerForm.value.newPassword ?? '');
    const c = String(this.restablecerForm.value.confirmPassword ?? '');
    return !!n && !!c && n !== c;
  }

  async solicitarCodigo(): Promise<void> {
    if (this.isLoading) return;

    if (this.solicitarForm.invalid) {
      this.solicitarForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.loadingAccion = 'solicitar';
    this.loadingFase = 'conectando';

    try {
      const usuario = String(this.solicitarForm.value.usuario).trim();
      const apiListo = await esperarApiDisponible(55_000);
      if (!apiListo) {
        await this.toast(
          'El servidor no respondió a tiempo. Espera un momento y vuelve a intentar.',
          'danger'
        );
        return;
      }

      this.loadingFase = 'enviando';
      const res = await this.auth.forgotPassword(usuario);
      if (!res.codeDispatched) {
        await this.toast(res.message, 'warning');
        return;
      }
      this.usuarioSolicitado = usuario;
      this.devCodeHint = res.devCode ?? null;
      this.emailEnviado = !!res.emailSent;
      this.paso = 'restablecer';
      await this.toast(res.message, res.emailSent ? 'success' : 'warning');
    } catch (err) {
      await this.toast(getHttpErrorMessage(err, 'No se pudo enviar el código'), 'danger');
    } finally {
      this.isLoading = false;
      this.loadingAccion = null;
      this.loadingFase = null;
    }
  }

  async restablecer(): Promise<void> {
    if (this.isLoading) return;

    if (this.restablecerForm.invalid || this.mismatch) {
      this.restablecerForm.markAllAsTouched();
      if (this.mismatch) {
        await this.toast('Las contraseñas no coinciden.', 'danger');
      }
      return;
    }

    this.isLoading = true;
    this.loadingAccion = 'restablecer';
    this.loadingFase = 'conectando';

    try {
      const apiListo = await esperarApiDisponible(55_000);
      if (!apiListo) {
        await this.toast(
          'El servidor no respondió a tiempo. Espera un momento y vuelve a intentar.',
          'danger'
        );
        return;
      }

      this.loadingFase = 'actualizando';
      const { code, newPassword } = this.restablecerForm.value;
      const res = await this.auth.resetPassword(this.usuarioSolicitado, code, newPassword);
      await this.toast(res.message, 'success');
      await this.navCtrl.navigateRoot('/login', { animated: false });
    } catch (err) {
      await this.toast(getHttpErrorMessage(err, 'No se pudo restablecer la contraseña'), 'danger');
    } finally {
      this.isLoading = false;
      this.loadingAccion = null;
      this.loadingFase = null;
    }
  }

  get mensajeEspera(): string {
    if (this.loadingFase === 'conectando') {
      return 'Conectando con el servidor (puede tardar hasta 1 minuto si Render estaba en reposo)…';
    }
    if (this.loadingFase === 'enviando') {
      return 'Enviando el código a tu correo…';
    }
    if (this.loadingFase === 'actualizando') {
      return 'Guardando tu nueva contraseña…';
    }
    return '';
  }

  /** Vuelve al paso inicial (usuario vacío o distinto). */
  volverASolicitar(): void {
    if (this.isLoading) return;
    this.paso = 'solicitar';
    this.devCodeHint = null;
    this.emailEnviado = false;
    this.restablecerForm.reset();
    if (this.usuarioSolicitado) {
      this.solicitarForm.patchValue({ usuario: this.usuarioSolicitado });
    }
  }

  /** Reenvía el código al mismo usuario sin salir del paso de restablecer. */
  async solicitarOtroCodigo(): Promise<void> {
    if (this.isLoading) return;

    if (!this.usuarioSolicitado?.trim()) {
      this.volverASolicitar();
      return;
    }

    this.solicitarForm.patchValue({ usuario: this.usuarioSolicitado });
    this.isLoading = true;
    this.loadingAccion = 'solicitar';
    this.loadingFase = 'conectando';

    try {
      const apiListo = await esperarApiDisponible(55_000);
      if (!apiListo) {
        await this.toast(
          'El servidor no respondió a tiempo. Espera un momento y vuelve a intentar.',
          'danger'
        );
        return;
      }

      this.loadingFase = 'enviando';
      const res = await this.auth.forgotPassword(this.usuarioSolicitado);
      if (!res.codeDispatched) {
        await this.toast(res.message, 'warning');
        return;
      }

      this.devCodeHint = res.devCode ?? null;
      this.emailEnviado = !!res.emailSent;
      this.restablecerForm.patchValue({ code: '', newPassword: '', confirmPassword: '' });
      await this.toast(
        res.emailSent
          ? `Enviamos un código nuevo a tu correo. Revisa también spam.`
          : res.message,
        res.emailSent ? 'success' : 'warning'
      );
    } catch (err) {
      await this.toast(getHttpErrorMessage(err, 'No se pudo enviar otro código'), 'danger');
    } finally {
      this.isLoading = false;
      this.loadingAccion = null;
      this.loadingFase = null;
    }
  }

  private async toast(message: string, color: string): Promise<void> {
    await presentIecaToast(this.toastCtrl, message, color, 3200);
  }
}
