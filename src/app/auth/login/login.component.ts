import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

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

  constructor(
    private fb: FormBuilder,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    // Inicializar el formulario con validaciones
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {}

  async onLogin() {
    if (this.loginForm.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Validando credenciales...',
        spinner: 'circles'
      });
      await loading.present();

      // Simulación de Login
      setTimeout(async () => {
        await loading.dismiss();
        const { usuario, password } = this.loginForm.value;

        if (usuario === 'admin' && password === '123456') {
          this.router.navigate(['/dashboard']);
        } else {
          this.presentToast('Usuario o contraseña incorrectos', 'danger');
        }
      }, 1500);
    } else {
      this.presentToast('Por favor, completa los campos correctamente', 'warning');
    }
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