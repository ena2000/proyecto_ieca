import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  alertCircle,
  arrowForwardCircle,
  eyeOffOutline,
  eyeOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../services/data.service';
import { getHttpErrorMessage } from '../../shared/utils/error-message.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import { despertarApiEnSegundoPlano, esperarApiDisponible } from '../../shared/utils/api-wake.util';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class LoginComponent implements OnInit {
  usuario = '';
  password = '';
  showPassword = false;
  isLoading = false;
  conectandoServidor = false;
  cargandoDatos = false;
  submitted = false;
  /** Error de credenciales o servidor; visible en el formulario (no solo toast). */
  authError: string | null = null;

  /** Descarta resultados de un intento anterior si el usuario vuelve a pulsar. */
  private loginAttempt = 0;

  constructor(
    private toastCtrl: ToastController,
    private router: Router,
    private authService: AuthService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      'alert-circle': alertCircle,
      'arrow-forward-circle': arrowForwardCircle,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline
    });
  }

  async ngOnInit(): Promise<void> {
    this.authService.purgeStaleSession();

    const sesion = new URLSearchParams(window.location.search).get('sesion')
      || this.router.parseUrl(this.router.url).queryParams['sesion'];
    if (sesion === 'expirada') {
      this.authError = 'Tu sesión expiró. Vuelve a iniciar sesión.';
      void presentIecaToast(this.toastCtrl, this.authError, 'warning', 4200);
      void this.router.navigate(['/login'], { replaceUrl: true });
    }

    if (this.authService.isAuthenticated()) {
      const ok = await this.dataService.bootstrapRemote(true);
      if (ok && this.authService.isAuthenticated()) {
        void this.router.navigateByUrl(this.authService.getRutaPorDefecto(), { replaceUrl: true });
      }
      return;
    }

    despertarApiEnSegundoPlano();
  }

  onCredencialesChange(): void {
    if (this.authError) {
      this.authError = null;
    }
  }

  /** Ionic a veces no sincroniza ngModel con autofill; leemos el detail del evento. */
  onUsuarioInput(ev: CustomEvent): void {
    this.usuario = String(ev.detail?.value ?? '');
    this.onCredencialesChange();
  }

  onPasswordInput(ev: CustomEvent): void {
    this.password = String(ev.detail?.value ?? '');
    this.onCredencialesChange();
  }

  async onLogin(): Promise<void> {
    if (this.isLoading) return;

    this.submitted = true;
    this.authError = null;
    this.syncCredencialesDesdeDom();

    const u = this.usuario.trim();
    const p = this.password;
    const passwordErr = p.trim().length < 6
      ? (!p.trim() && p.length > 0
        ? 'La contraseña no puede ser solo espacios.'
        : null)
      : null;

    if (u.length < 4 || p.trim().length < 6) {
      this.authError =
        passwordErr ||
        'Completa usuario (mín. 4 caracteres) y contraseña (mín. 6).';
      await this.presentToast(this.authError, 'warning');
      return;
    }

    const attempt = ++this.loginAttempt;
    this.isLoading = true;
    this.conectandoServidor = true;
    this.cargandoDatos = false;
    this.cdr.detectChanges();

    try {
      await this.ejecutarLogin(u, p, attempt);
    } catch (error) {
      if (attempt !== this.loginAttempt) return;
      this.liberarLoading();
      this.authError = getHttpErrorMessage(
        error,
        error instanceof Error && error.message
          ? error.message
          : 'Error en la autenticación. Intenta de nuevo.'
      );
      await this.presentToast(this.authError, 'danger', 4500);
    } finally {
      if (attempt === this.loginAttempt) {
        this.liberarLoading();
      }
    }
  }

  private liberarLoading(): void {
    this.isLoading = false;
    this.conectandoServidor = false;
    this.cargandoDatos = false;
    this.cdr.detectChanges();
  }

  private async ejecutarLogin(u: string, p: string, attempt: number): Promise<void> {
    // Starter no tiene cold start largo; 8s basta para un bache puntual.
    const apiListo = await esperarApiDisponible(8_000);
    if (attempt !== this.loginAttempt) return;
    if (!apiListo) {
      throw new Error(
        'El servidor no respondió a tiempo. Espera un momento y vuelve a intentar.'
      );
    }

    this.conectandoServidor = false;
    this.cdr.detectChanges();

    const result = await this.authService.login(u, p);
    if (attempt !== this.loginAttempt) return;

    if (!result.success) {
      this.liberarLoading();
      this.authError = result.mensaje || 'Usuario o contraseña incorrectos.';
      await this.presentToast(this.authError, 'danger', 4500);
      return;
    }

    const destino = this.authService.getRutaPorDefecto();
    const user = this.authService.getSession();
    this.cargandoDatos = true;
    this.cdr.detectChanges();

    const bootstrapOk = await this.dataService.bootstrapRemote(true);
    if (attempt !== this.loginAttempt) return;

    if (!this.authService.isAuthenticated()) {
      this.liberarLoading();
      this.authError = 'Tu sesión expiró. Vuelve a iniciar sesión.';
      await this.presentToast(this.authError, 'warning', 4500);
      return;
    }
    if (!bootstrapOk) {
      this.liberarLoading();
      this.authError = 'No se pudieron cargar los datos. Intenta de nuevo.';
      await this.presentToast(this.authError, 'danger', 4500);
      return;
    }

    this.liberarLoading();
    void this.router.navigateByUrl(destino, { replaceUrl: true });
    void this.presentToast(`¡Bienvenido ${user?.usuario}!`, 'success');
  }

  private syncCredencialesDesdeDom(): void {
    const userHost = document.getElementById('login-usuario');
    const passHost = document.getElementById('login-password');
    const userVal =
      (userHost as HTMLInputElement | null)?.value ??
      userHost?.querySelector?.('input')?.value;
    const passVal =
      (passHost as HTMLInputElement | null)?.value ??
      passHost?.querySelector?.('input')?.value;
    if (typeof userVal === 'string' && userVal.length) {
      this.usuario = userVal;
    }
    if (typeof passVal === 'string' && passVal.length) {
      this.password = passVal;
    }
  }

  async presentToast(msj: string, color: string, duration = 2600): Promise<void> {
    await presentIecaToast(this.toastCtrl, msj, color, duration, undefined, 'ieca-toast--login');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  get usuarioError(): string | null {
    if (!this.submitted || this.isLoading) return null;
    if (!this.usuario.trim()) return 'El usuario es obligatorio.';
    if (this.usuario.trim().length < 4) return 'Mínimo 4 caracteres.';
    return null;
  }

  get passwordError(): string | null {
    if (!this.submitted || this.isLoading) return null;
    if (!this.password) return 'La contraseña es obligatoria.';
    if (!this.password.trim()) return 'La contraseña no puede ser solo espacios.';
    if (this.password.trim().length < 6) return 'Mínimo 6 caracteres.';
    return null;
  }
}
