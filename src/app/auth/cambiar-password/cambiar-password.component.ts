import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonInput, IonicModule, NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { getHttpErrorMessage } from '../../shared/utils/error-message.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import { leerValorIonInputAsync } from '../../shared/utils/movimiento-form-sync.util';
import { FORM_GUARDADO_TOAST_MS, scrollAlErrorFormulario } from '../../shared/utils/form-guardado.util';
import { despertarApiEnSegundoPlano } from '../../shared/utils/api-wake.util';
import { esPasswordValida, mensajeErrorPassword } from '../../shared/utils/usuario-validacion.util';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './cambiar-password.component.html',
  styleUrls: ['./cambiar-password.component.scss']
})
export class CambiarPasswordComponent implements OnInit {
  form!: FormGroup;
  showOld = false;
  showNew = false;
  showConfirm = false;
  guardando = false;
  formGuardadoError: string | null = null;

  @ViewChild('oldPasswordInput') oldPasswordInput?: IonInput;
  @ViewChild('newPasswordInput') newPasswordInput?: IonInput;
  @ViewChild('confirmPasswordInput') confirmPasswordInput?: IonInput;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly toastCtrl: ToastController,
    private readonly navCtrl: NavController
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
    despertarApiEnSegundoPlano();
  }

  get mismatch(): boolean {
    const n = String(this.form.value.newPassword ?? '');
    const c = String(this.form.value.confirmPassword ?? '');
    return !!n && !!c && n !== c;
  }

  async submit(): Promise<void> {
    if (this.guardando) return;

    this.formGuardadoError = null;
    await this.sincronizarFormularioAntesDeGuardar();

    if (this.form.invalid || this.mismatch) {
      this.form.markAllAsTouched();
      this.formGuardadoError = this.mismatch
        ? 'Las contraseñas nuevas no coinciden.'
        : 'Revisa los campos. Cada contraseña debe tener al menos 6 caracteres.';
      await this.toast(this.formGuardadoError, 'danger', FORM_GUARDADO_TOAST_MS);
      scrollAlErrorFormulario();
      return;
    }

    const oldP = String(this.form.value.oldPassword ?? '');
    const newP = String(this.form.value.newPassword ?? '');
    const passErr =
      mensajeErrorPassword(oldP, 6, 'contraseña actual') ||
      mensajeErrorPassword(newP, 6, 'nueva contraseña');
    if (passErr || !esPasswordValida(oldP) || !esPasswordValida(newP)) {
      this.formGuardadoError = passErr || 'La contraseña no puede ser solo espacios.';
      await this.toast(this.formGuardadoError, 'danger', FORM_GUARDADO_TOAST_MS);
      scrollAlErrorFormulario();
      return;
    }

    this.guardando = true;
    try {
      await this.auth.changePassword(oldP, newP.trim());
      await this.toast('Contraseña actualizada. ¡Listo!', 'success');
      await this.navCtrl.navigateRoot(this.auth.getRutaPorDefecto(), { animated: false });
    } catch (err) {
      this.formGuardadoError = getHttpErrorMessage(err, 'No se pudo cambiar la contraseña');
      await this.toast(this.formGuardadoError, 'danger', FORM_GUARDADO_TOAST_MS);
      scrollAlErrorFormulario();
    } finally {
      this.guardando = false;
    }
  }

  private async sincronizarFormularioAntesDeGuardar(): Promise<void> {
    const [oldRaw, newRaw, confirmRaw] = await Promise.all([
      leerValorIonInputAsync(this.oldPasswordInput),
      leerValorIonInputAsync(this.newPasswordInput),
      leerValorIonInputAsync(this.confirmPasswordInput)
    ]);
    this.form.patchValue({
      oldPassword: oldRaw,
      newPassword: newRaw,
      confirmPassword: confirmRaw
    });
  }

  private async toast(message: string, color: string, duration = 2800): Promise<void> {
    await presentIecaToast(this.toastCtrl, message, color, duration);
  }
}
