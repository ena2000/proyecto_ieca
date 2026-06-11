import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
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
  submitted = false;

  constructor(
    private toastCtrl: ToastController,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      void this.router.navigateByUrl(this.authService.getRutaPorDefecto(), { replaceUrl: true });
      return;
    }

    despertarApiEnSegundoPlano();
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
    this.conectandoServidor = true;

    try {
      const apiListo = await esperarApiDisponible(55_000);
      if (!apiListo) {
        await this.presentToast(
          'El servidor no respondió a tiempo. Espera un momento y vuelve a intentar.',
          'danger'
        );
        return;
      }

      this.conectandoServidor = false;
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
      this.isLoading = false;
      this.conectandoServidor = false;
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
