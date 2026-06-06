import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { getHttpErrorMessage } from '../../shared/utils/error-message.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import { environment } from '../../../environments/environment';

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
  submitted = false;

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      void this.router.navigateByUrl(this.authService.getRutaPorDefecto(), { replaceUrl: true });
      return;
    }

    // En producción, despierta Render antes del primer login (cold start).
    if (environment.production && !environment.useLocalFallback) {
      const base = environment.apiUrl.replace(/\/$/, '');
      void fetch(`${base}/health`, { mode: 'cors' }).catch(() => undefined);
    }
  }

  async onLogin(): Promise<void> {
    if (this.isLoading) return;

    this.submitted = true;

    const u = this.usuario.trim();
    const p = this.password;

    if (u.length < 4 || p.length < 6) {
      await this.presentToast('Completa usuario (mín. 4) y contraseña (mín. 6).', 'warning');
      return;
    }

    this.isLoading = true;
    let loading: HTMLIonLoadingElement | null = null;

    try {
      loading = await this.loadingCtrl.create({
        message: 'Conectando con el servidor… La primera vez puede tardar hasta 1 minuto.',
        spinner: 'circles',
        cssClass: 'ieca-loading'
      });
      await loading.present();

      const result = await this.authService.login(u, p);

      if (result.success) {
        const destino = this.authService.getRutaPorDefecto();
        const user = this.authService.getSession();
        void this.router.navigateByUrl(destino, { replaceUrl: true });
        void this.presentToast(`¡Bienvenido ${user?.usuario}!`, 'success');
      } else {
        await this.presentToast(result.mensaje || 'Usuario o contraseña incorrectos', 'danger');
      }
    } catch (error) {
      await this.presentToast(getHttpErrorMessage(error, 'Error en la autenticación. Intenta de nuevo.'), 'danger');
    } finally {
      if (loading) {
        await loading.dismiss().catch(() => undefined);
      }
      this.isLoading = false;
    }
  }

  async presentToast(msj: string, color: string): Promise<void> {
    await presentIecaToast(this.toastCtrl, msj, color);
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
