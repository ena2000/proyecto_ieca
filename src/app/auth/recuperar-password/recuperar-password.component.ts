import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { getHttpErrorMessage } from '../../shared/utils/error-message.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import { leerValorIonInput } from '../../shared/utils/movimiento-form-sync.util';
import { despertarApiEnSegundoPlano, esperarApiDisponible } from '../../shared/utils/api-wake.util';

const LOG_PREFIX = '[recuperar-password]';

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
  /** Campos del paso 2: ngModel (ion-input no sincroniza bien con reactive forms). */
  code = '';
  newPassword = '';
  confirmPassword = '';
  showNew = false;
  showConfirm = false;
  isLoading = false;
  loadingAccion: 'solicitar' | 'restablecer' | null = null;
  loadingFase: LoadingFase | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly toastCtrl: ToastController,
    private readonly navCtrl: NavController,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.solicitarForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]]
    });

  }

  ngOnInit(): void {
    despertarApiEnSegundoPlano();
  }

  get mismatch(): boolean {
    return (
      !!this.newPassword &&
      !!this.confirmPassword &&
      this.newPassword !== this.confirmPassword
    );
  }

  get puedeRestablecer(): boolean {
    return (
      /^\d{6}$/.test(this.code.trim()) &&
      this.newPassword.length >= 6 &&
      this.confirmPassword.length >= 6 &&
      this.newPassword === this.confirmPassword
    );
  }

  get motivoBotonDeshabilitado(): string {
    const code = this.code.trim();
    if (!/^\d{6}$/.test(code)) {
      return `Código del correo: ${code.length}/6 dígitos`;
    }
    if (this.newPassword.length < 6) {
      return `Nueva contraseña: mínimo 6 caracteres (llevas ${this.newPassword.length})`;
    }
    if (this.confirmPassword.length < 6) {
      return 'Debes repetir la misma contraseña en «Confirmar contraseña»';
    }
    if (this.mismatch) {
      return 'Las dos contraseñas deben ser iguales';
    }
    return '';
  }

  onCampoRestablecer(field: 'code' | 'newPassword' | 'confirmPassword', event: Event): void {
    let value = leerValorIonInput(event);
    if (field === 'code') {
      this.code = value.replace(/\D/g, '').slice(0, 6);
    } else if (field === 'newPassword') {
      this.newPassword = value;
    } else {
      this.confirmPassword = value;
    }
    this.logEstadoRestablecer(`ionInput:${field}`);
    this.cdr.markForCheck();
  }

  onUsuarioInput(event: Event): void {
    this.solicitarForm.patchValue({ usuario: leerValorIonInput(event).trim() });
  }

  private logEstadoRestablecer(origen: string): void {
    const estado = {
      origen,
      code: this.code,
      codeLen: this.code.length,
      newPasswordLen: this.newPassword.length,
      confirmPasswordLen: this.confirmPassword.length,
      mismatch: this.mismatch,
      puedeRestablecer: this.puedeRestablecer,
      motivo: this.motivoBotonDeshabilitado || 'listo'
    };
    console.log(LOG_PREFIX, estado);
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
      this.code = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.paso = 'restablecer';
      console.log(LOG_PREFIX, 'paso restablecer', {
        usuario: this.usuarioSolicitado,
        emailEnviado: this.emailEnviado
      });
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
    this.logEstadoRestablecer('click-restablecer');

    if (this.isLoading) return;

    if (!this.puedeRestablecer) {
      const motivo = this.motivoBotonDeshabilitado || 'Completa todos los campos.';
      console.warn(LOG_PREFIX, 'bloqueado antes de enviar', motivo);
      await this.toast(motivo, 'warning');
      return;
    }

    if (this.mismatch) {
      await this.toast('Las contraseñas no coinciden.', 'danger');
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
      console.log(LOG_PREFIX, 'enviando reset-password', {
        usuario: this.usuarioSolicitado,
        code: this.code.trim(),
        newPasswordLen: this.newPassword.length
      });
      const res = await this.auth.resetPassword(
        this.usuarioSolicitado,
        this.code.trim(),
        this.newPassword
      );
      await this.toast(res.message, 'success');
      await this.navCtrl.navigateRoot('/login', { animated: false });
    } catch (err) {
      console.error(LOG_PREFIX, 'error reset-password', err);
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
    this.code = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  private async toast(message: string, color: string): Promise<void> {
    await presentIecaToast(this.toastCtrl, message, color, 3200);
  }
}
