import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { getHttpErrorMessage } from '../../shared/utils/error-message.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import { leerValorIonInput } from '../../shared/utils/movimiento-form-sync.util';
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

  get puedeRestablecer(): boolean {
    const code = String(this.restablecerForm.value.code ?? '').trim();
    const newPassword = String(this.restablecerForm.value.newPassword ?? '');
    const confirmPassword = String(this.restablecerForm.value.confirmPassword ?? '');
    return (
      /^\d{6}$/.test(code) &&
      newPassword.length >= 6 &&
      confirmPassword.length >= 6 &&
      newPassword === confirmPassword
    );
  }

  onUsuarioInput(event: Event): void {
    this.solicitarForm.patchValue({ usuario: leerValorIonInput(event).trim() });
  }

  onRestablecerInput(field: 'code' | 'newPassword' | 'confirmPassword', event: Event): void {
    let value = leerValorIonInput(event);
    if (field === 'code') {
      value = value.replace(/\D/g, '').slice(0, 6);
    }
    this.restablecerForm.patchValue({ [field]: value });
  }

  async solicitarCodigo(): Promise<void> {
    if (this.isLoading) return;

    if (this.solicitarForm.invalid) {
      this.solicitarForm.markAllAsTouched();
      await this.toast('Ingresa tu usuario o email (mínimo 3 caracteres).', 'danger');
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
    if (this.isLoading || !this.puedeRestablecer) return;

    if (this.restablecerForm.invalid || this.mismatch) {
      this.restablecerForm.markAllAsTouched();
      if (this.mismatch) {
        await this.toast('Las contraseñas no coinciden.', 'danger');
      } else {
        await this.toast(
          'Revisa los campos. Código de 6 dígitos y contraseña de al menos 6 caracteres.',
          'danger'
        );
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

  volverASolicitar(): void {
    if (this.isLoading) return;
    this.paso = 'solicitar';
    this.devCodeHint = null;
    this.emailEnviado = false;
    this.restablecerForm.reset();
  }

  private async toast(message: string, color: string): Promise<void> {
    await presentIecaToast(this.toastCtrl, message, color, 3200);
  }
}
