import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
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

  constructor(
    private toastCtrl: ToastController,
    private router: Router,
    private authService: AuthService,
    private dataService: DataService
  ) {}

  async ngOnInit(): Promise<void> {
    this.authService.purgeStaleSession();

    if (this.authService.isAuthenticated()) {
      const ok = await this.dataService.bootstrapRemote();
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

  async onLogin(): Promise<void> {
    if (this.isLoading) return;

    this.submitted = true;
    this.authError = null;

    const u = this.usuario.trim();
    const p = this.password;

    if (u.length < 4 || p.length < 6) {
      this.authError = 'Completa usuario (mín. 4 caracteres) y contraseña (mín. 6).';
      await this.presentToast(this.authError, 'warning');
      return;
    }

    this.isLoading = true;
    this.conectandoServidor = true;

    try {
      const apiListo = await esperarApiDisponible(55_000);
      if (!apiListo) {
        this.authError =
          'El servidor no respondió a tiempo. Espera un momento y vuelve a intentar.';
        await this.presentToast(this.authError, 'danger');
        return;
      }

      this.conectandoServidor = false;
      const result = await this.authService.login(u, p);

      if (result.success) {
        const destino = this.authService.getRutaPorDefecto();
        const user = this.authService.getSession();
        this.cargandoDatos = true;
        const bootstrapOk = await this.dataService.bootstrapRemote(true);
        this.cargandoDatos = false;

        if (!this.authService.isAuthenticated()) {
          this.authError = 'Tu sesión expiró. Vuelve a iniciar sesión.';
          await this.presentToast(this.authError, 'warning', 4500);
          return;
        }
        if (!bootstrapOk) {
          this.authError = 'No se pudieron cargar los datos. Intenta de nuevo.';
          await this.presentToast(this.authError, 'danger', 4500);
          return;
        }

        void this.router.navigateByUrl(destino, { replaceUrl: true });
        void this.presentToast(`¡Bienvenido ${user?.usuario}!`, 'success');
      } else {
        this.authError = result.mensaje || 'Usuario o contraseña incorrectos.';
        await this.presentToast(this.authError, 'danger', 4500);
      }
    } catch (error) {
      this.authError = getHttpErrorMessage(error, 'Error en la autenticación. Intenta de nuevo.');
      await this.presentToast(this.authError, 'danger', 4500);
    } finally {
      this.isLoading = false;
      this.conectandoServidor = false;
    }
  }

  async presentToast(msj: string, color: string, duration = 2600): Promise<void> {
    await presentIecaToast(this.toastCtrl, msj, color, duration, undefined, 'ieca-toast--login');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  get usuarioError(): string | null {
    if (!this.submitted) return null;
    if (!this.usuario.trim()) return 'El usuario es obligatorio.';
    if (this.usuario.trim().length < 4) return 'Mínimo 4 caracteres.';
    return null;
  }

  get passwordError(): string | null {
    if (!this.submitted) return null;
    if (!this.password) return 'La contraseña es obligatoria.';
    if (this.password.length < 6) return 'Mínimo 6 caracteres.';
    return null;
  }
}
