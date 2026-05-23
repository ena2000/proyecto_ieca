import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    usuario: string;
    email?: string;
    rol?: string;
  };
  mensaje?: string;
}

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

  // Datos quemados para prueba
  private readonly HARDCODED_USERS = [
    { usuario: 'admin', password: '123456', id: '1', rol: 'admin', email: 'admin@ieca.com' },
    { usuario: 'usuario', password: 'password123', id: '2', rol: 'user', email: 'user@ieca.com' }
  ];

  constructor(
    private fb: FormBuilder,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {}

  async onLogin() {
    if (!this.loginForm.valid) {
      this.presentToast('Por favor, completa los campos correctamente', 'warning');
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Validando credenciales...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      // Simulación de llamada al backend
      const response = await this.authenticate(
        this.loginForm.value.usuario,
        this.loginForm.value.password
      );

      await loading.dismiss();

      if (response.success) {
        // Guardar datos en localStorage para usar después
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
        if (response.user) {
          localStorage.setItem('user_data', JSON.stringify(response.user));
        }

        this.presentToast(`¡Bienvenido ${response.user?.usuario}!`, 'success');
        this.router.navigate(['/dashboard']);
      } else {
        this.presentToast(response.mensaje || 'Usuario o contraseña incorrectos', 'danger');
      }
    } catch (error) {
      await loading.dismiss();
      this.presentToast('Error en la autenticación. Intenta de nuevo.', 'danger');
      console.error('Error en login:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private authenticate(usuario: string, password: string): Promise<LoginResponse> {
    return new Promise((resolve) => {
      // Simular latencia de red (1.5 segundos)
      setTimeout(() => {
        const user = this.HARDCODED_USERS.find(
          u => u.usuario === usuario && u.password === password
        );

        if (user) {
          resolve({
            success: true,
            token: `token_${user.id}_${Date.now()}`,
            user: {
              id: user.id,
              usuario: user.usuario,
              email: user.email,
              rol: user.rol
            }
          });
        } else {
          resolve({
            success: false,
            mensaje: 'Usuario o contraseña incorrectos'
          });
        }
      }, 1500);
    });
  }

  async presentToast(msj: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msj,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}