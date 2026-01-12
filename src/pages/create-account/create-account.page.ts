import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { UserService } from 'src/services/user-service';
import { SessionService } from 'src/services/session.service';
import { UserRequest } from 'src/models/requests/user-request';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.page.html',
  styleUrls: ['./create-account.page.scss'],
})
export class CreateAccountPage implements OnInit {

  registerForm!: FormGroup;
  loading = false;

  /** erros vindos do backend */
  serverErrors: Record<string, string> = {};

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private alertController: AlertController,
    private sessionService: SessionService
  ) { }

  ngOnInit(): void {
    this.buildForm();
  }

  /* -------------------------------------------------------------------------- */
  /* FORM                                                                       */
  /* -------------------------------------------------------------------------- */

  private buildForm(): void {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        lastname: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.minLength(10)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        termsAccepted: [false, Validators.requiredTrue],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  /* -------------------------------------------------------------------------- */
  /* VALIDATORS                                                                  */
  /* -------------------------------------------------------------------------- */

  private passwordMatchValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;

    if (!password || !confirm) return null;
    return password !== confirm ? { mismatch: true } : null;
  };

  /* -------------------------------------------------------------------------- */
  /* HELPERS                                                                     */
  /* -------------------------------------------------------------------------- */

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!field && field.invalid && (field.touched || field.dirty);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (this.serverErrors[fieldName]) {
      return this.serverErrors[fieldName];
    }

    const errors = field.errors;

    if (errors['required']) return 'Este campo é obrigatório';
    if (errors['email']) return 'E-mail inválido';
    if (errors['minlength']) {
      return `Mínimo de ${errors['minlength'].requiredLength} caracteres`;
    }
    if (errors['requiredTrue']) {
      return 'Você deve aceitar os termos';
    }

    return 'Campo inválido';
  }

  /* -------------------------------------------------------------------------- */
  /* SUBMIT                                                                      */
  /* -------------------------------------------------------------------------- */

  async onSubmit(event: Event) {
    event.preventDefault();

    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.serverErrors = {};

    const formValue = this.registerForm.value;

    const userData: UserRequest = {
      name: formValue.name,
      lastName: formValue.lastname,
      email: formValue.email,
      phone: formValue.phone.replace(/\D/g, ''),
      address: formValue.address,
      neighborhood: formValue.neighborhood,
      city: formValue.city,
      stateId: formValue.state,
      cep: formValue.cep.replace(/\D/g, ''),
      password: formValue.password
    };

    try {
      await this.userService.createUser(userData).toPromise();

      this.sessionService.setGenericKey(
        { email: userData.email, newUser: true },
        'pendingUser'
      );

      const alert = await this.alertController.create({
        header: 'Sucesso',
        message: 'Cadastro realizado com sucesso!',
        buttons: [{
          text: 'OK',
          handler: () => this.router.navigate(['/validate-code'])
        }]
      });

      await alert.present();

    } catch (err: any) {
      await this.handleServerError(err);
    } finally {
      this.loading = false;
    }
  }


  /* -------------------------------------------------------------------------- */
  /* ERROR HANDLING                                                              */
  /* -------------------------------------------------------------------------- */

  private async handleServerError(err: any): Promise<void> {
    if (err?.error?.errors && Array.isArray(err.error.errors)) {
      err.error.errors.forEach((e: any) => {
        if (e.field) {
          this.serverErrors[e.field] = e.message;
          this.registerForm.get(e.field)?.setErrors({ server: true });
        }
      });

      if (Object.keys(this.serverErrors).length) return;
    }

    const alert = await this.alertController.create({
      header: 'Erro',
      message:
        err?.error?.message ||
        'Erro ao processar o cadastro. Tente novamente.',
      buttons: ['OK'],
    });

    await alert.present();
  }
}
