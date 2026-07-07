import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { getHttpErrorMessage } from '../../shared/utils/error-message.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import { leerValorIonInput } from '../../shared/utils/movimiento-form-sync.util';
import { despertarApiEnSegundoPlano, esperarApiDisponible } from '../../shared/utils/api-wake.util';

type Paso = 'solicitar' | 'restablecer';

const STORAGE_USER = 'ieca_recovery_usuario';
const STORAGE_STEP = 'ieca_recovery_paso';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  templateUrl: './recuperar-password.component.html',
  styleUrls: ['./recuperar-password.component.scss']
})
export class RecuperarPasswordComponent implements OnInit {
  paso: Paso = 'solicitar';
  usuarioSolicitado = '';
  devCodeHint: string | null = null;
  emailEnviado = false;
  formError: string | null = null;

  usuario = '';
  code = '';
  newPassword = '';
  confirmPassword = '';

  showNew = false;
  showConfirm = false;
  enviandoCodigo = false;
  restableciendo = false;
  mensajeEspera = '';

  constructor(
    private readonly auth: AuthService,
    private readonly toastCtrl: ToastController,
    private readonly navCtrl: NavController
  ) {}

  ngOnInit(): void {
    despertarApiEnSegundoPlano();
    this.restaurarSesionRecuperacion();
  }

  get mismatch(): boolean {
    const n = String(this.newPassword ?? '').trim();
    const c = String(this.confirmPassword ?? '').trim();
    return !!n && !!c && n !== c;
  }

  onUsuarioInput(event: Event): void {
    this.usuario = leerValorIonInput(event).trim();
    this.formError = null;
  }

  onCodeInput(event: Event): void {
    this.code = this.normalizarCodigo(leerValorIonInput(event));
    this.formError = null;
  }

  onNewPasswordInput(event: Event): void {
    this.newPassword = leerValorIonInput(event);
    this.formError = null;
  }

  onConfirmPasswordInput(event: Event): void {
    this.confirmPassword = leerValorIonInput(event);
    this.formError = null;
  }

  async solicitarCodigo(): Promise<void> {
    if (this.enviandoCodigo || this.restableciendo) return;

    this.formError = null;
    const login = String(this.usuario ?? '').trim();
    if (login.length < 3) {
      this.formError = 'Ingresa tu usuario o email (mínimo 3 caracteres).';
      await this.toast(this.formError, 'danger');
      return;
    }

    this.enviandoCodigo = true;
    this.mensajeEspera = 'Conectando con el servidor…';

    try {
      const apiListo = await esperarApiDisponible(55_000);
      if (!apiListo) {
        await this.toast(
          'El servidor no respondió a tiempo. Espera un momento y vuelve a intentar.',
          'danger'
        );
        return;
      }

      this.mensajeEspera = 'Enviando el código a tu correo…';
      const res = await this.auth.forgotPassword(login);
      if (!res.codeDispatched) {
        await this.toast(res.message, 'warning');
        return;
      }

      this.usuarioSolicitado = login;
      this.usuario = login;
      this.devCodeHint = res.devCode ?? null;
      this.emailEnviado = !!res.emailSent;
      this.paso = 'restablecer';
      this.limpiarCamposRestablecer();
      this.guardarSesionRecuperacion();
      await this.toast(res.message, res.emailSent ? 'success' : 'warning');
    } catch (err) {
      await this.toast(getHttpErrorMessage(err, 'No se pudo enviar el código'), 'danger');
    } finally {
      this.enviandoCodigo = false;
      this.mensajeEspera = '';
    }
  }

  async solicitarOtroCodigo(): Promise<void> {
    if (this.enviandoCodigo || this.restableciendo) return;

    const login = String(this.usuarioSolicitado ?? this.usuario ?? '').trim();
    if (!login) {
      this.paso = 'solicitar';
      this.formError = 'Ingresa tu usuario o email para solicitar un código.';
      await this.toast(this.formError, 'warning');
      return;
    }

    this.usuarioSolicitado = login;
    this.usuario = login;
    this.formError = null;
    this.enviandoCodigo = true;
    this.mensajeEspera = 'Enviando un código nuevo a tu correo…';

    try {
      const apiListo = await esperarApiDisponible(55_000);
      if (!apiListo) {
        await this.toast(
          'El servidor no respondió a tiempo. Espera un momento y vuelve a intentar.',
          'danger'
        );
        return;
      }

      const res = await this.auth.forgotPassword(login);
      if (!res.codeDispatched) {
        await this.toast(res.message, 'warning');
        return;
      }

      this.devCodeHint = res.devCode ?? null;
      this.emailEnviado = !!res.emailSent;
      this.limpiarCamposRestablecer();
      this.guardarSesionRecuperacion();
      await this.toast(
        res.emailSent
          ? 'Enviamos un código nuevo. Revisa tu correo y también spam.'
          : res.message,
        res.emailSent ? 'success' : 'warning'
      );
    } catch (err) {
      await this.toast(getHttpErrorMessage(err, 'No se pudo enviar otro código'), 'danger');
    } finally {
      this.enviandoCodigo = false;
      this.mensajeEspera = '';
    }
  }

  async restablecer(): Promise<void> {
    if (this.enviandoCodigo || this.restableciendo) return;

    this.formError = null;
    const error = this.validarRestablecer();
    if (error) {
      this.formError = error;
      await this.toast(error, 'danger');
      return;
    }

    const login = String(this.usuarioSolicitado ?? '').trim();
    const code = this.normalizarCodigo(this.code);
    const newPwd = String(this.newPassword ?? '').trim();

    this.restableciendo = true;
    this.mensajeEspera = 'Guardando tu nueva contraseña…';

    try {
      const apiListo = await esperarApiDisponible(55_000);
      if (!apiListo) {
        await this.toast(
          'El servidor no respondió a tiempo. Espera un momento y vuelve a intentar.',
          'danger'
        );
        return;
      }

      const res = await this.auth.resetPassword(login, code, newPwd);
      this.limpiarSesionRecuperacion();
      await this.toast(res.message, 'success');
      await this.navCtrl.navigateRoot('/login', { animated: false });
    } catch (err) {
      await this.toast(getHttpErrorMessage(err, 'No se pudo restablecer la contraseña'), 'danger');
    } finally {
      this.restableciendo = false;
      this.mensajeEspera = '';
    }
  }

  volverASolicitar(): void {
    if (this.enviandoCodigo || this.restableciendo) return;
    this.paso = 'solicitar';
    this.formError = null;
    this.devCodeHint = null;
    this.emailEnviado = false;
    this.limpiarCamposRestablecer();
    if (this.usuarioSolicitado) {
      this.usuario = this.usuarioSolicitado;
    }
    sessionStorage.removeItem(STORAGE_STEP);
  }

  private validarRestablecer(): string | null {
    if (!String(this.usuarioSolicitado ?? '').trim()) {
      return 'Sesión de recuperación perdida. Vuelve a solicitar el código.';
    }

    const code = this.normalizarCodigo(this.code);
    const newPwd = String(this.newPassword ?? '').trim();
    const confirmPwd = String(this.confirmPassword ?? '').trim();

    if (code.length !== 6) {
      return 'El código debe tener exactamente 6 dígitos.';
    }
    if (newPwd.length < 6) {
      return 'Cada contraseña debe tener al menos 6 caracteres.';
    }
    if (newPwd !== confirmPwd) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  }

  private normalizarCodigo(raw: string): string {
    return String(raw ?? '').replace(/\D/g, '').slice(0, 6);
  }

  private limpiarCamposRestablecer(): void {
    this.code = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.formError = null;
  }

  private guardarSesionRecuperacion(): void {
    sessionStorage.setItem(STORAGE_USER, this.usuarioSolicitado);
    sessionStorage.setItem(STORAGE_STEP, 'restablecer');
  }

  private restaurarSesionRecuperacion(): void {
    const user = sessionStorage.getItem(STORAGE_USER)?.trim();
    const step = sessionStorage.getItem(STORAGE_STEP);
    if (!user || step !== 'restablecer') return;

    this.usuarioSolicitado = user;
    this.usuario = user;
    this.paso = 'restablecer';
    this.emailEnviado = true;
  }

  private limpiarSesionRecuperacion(): void {
    sessionStorage.removeItem(STORAGE_USER);
    sessionStorage.removeItem(STORAGE_STEP);
  }

  private async toast(message: string, color: string): Promise<void> {
    await presentIecaToast(this.toastCtrl, message, color, 3200);
  }
}
