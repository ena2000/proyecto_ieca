import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { getHttpErrorMessage } from '../../shared/utils/error-message.util';
import { presentIecaToast } from '../../shared/utils/toast.util';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, ReactiveFormsModule]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      void this.router.navigateByUrl(this.authService.getRutaPorDefecto(), { replaceUrl: true });
    }
  }

  async onLogin() {
    this.submitted = true;
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Validando credenciales...',
      spinner: 'circles',
      cssClass: 'ieca-loading'
    });
    await loading.present();

    try {
      const result = await this.authService.login(
        this.loginForm.value.usuario,
        this.loginForm.value.password
      );

      if (result.success) {
        const destino = this.authService.getRutaPorDefecto();
        await this.router.navigateByUrl(destino, { replaceUrl: true });
        const user = this.authService.getSession();
        await this.presentToast(`¡Bienvenido ${user?.usuario}!`, 'success');
      } else {
        this.presentToast(result.mensaje || 'Usuario o contraseña incorrectos', 'danger');
      }
    } catch (error) {
      this.presentToast(getHttpErrorMessage(error, 'Error en la autenticación. Intenta de nuevo.'), 'danger');
    } finally {
      await loading.dismiss().catch(() => undefined);
      this.isLoading = false;
    }
  }

  async presentToast(msj: string, color: string) {
    await presentIecaToast(this.toastCtrl, msj, color);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  get usuarioError(): string | null {
    const c = this.loginForm.get('usuario');
    if (!c || (!this.submitted && !c.touched)) return null;
    if (c.hasError('required')) return 'El usuario es obligatorio.';
    if (c.hasError('minlength')) return 'Mínimo 4 caracteres.';
    return null;
  }

  get passwordError(): string | null {
    const c = this.loginForm.get('password');
    if (!c || (!this.submitted && !c.touched)) return null;
    if (c.hasError('required')) return 'La contraseña es obligatoria.';
    if (c.hasError('minlength')) return 'Mínimo 6 caracteres.';
    return null;
  }
}
