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
import { AlertController, LoadingController } from '@ionic/angular';
import { UserService } from 'src/services/user-service';
import { SessionService } from 'src/services/session.service';
import { GeoLocateService } from 'src/services/geo-locate.service';
import { UserRequest } from 'src/models/requests/user-request';
import { ToastService } from 'src/services/toast.service';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.page.html',
  styleUrls: ['./create-account.page.scss'],
})
export class CreateAccountPage implements OnInit {

  registerForm!: FormGroup;
  loading = false;
  searchingCep = false;

  serverErrors: Record<string, string> = {};

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private alertController: AlertController,
    private sessionService: SessionService,
    private geLocation: GeoLocateService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        lastname: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.minLength(10)]],
        cep: ['', [Validators.required, Validators.minLength(8)]],
        address: [{ value: '', disabled: true }],
        neighborhood: [{ value: '', disabled: true }],
        city: [{ value: '', disabled: true }],
        state: [''],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        termsAccepted: [false, Validators.requiredTrue],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    return password && confirm && password !== confirm ? { mismatch: true } : null;
  };

  async searchCep() {
    const cepControl = this.registerForm.get('cep');
    if (!cepControl || cepControl.invalid) {
      return;
    }

    const cep = cepControl.value.replace(/\D/g, '');
    if (cep.length !== 8) {
      return;
    }

    try {
      this.geLocation.getAddressByCep(cep).subscribe({
        next: (response: any) => {
          if (response.valid && response.data) {
            this.registerForm.patchValue({
              address: response.data.lagradouro,
              neighborhood: response.data.bairro,
              city: response.data.localidade,
              state: response.data.uf || response.data.estado
            });
          } else {
            this.showCepError(response.message);
            cepControl.setErrors({ invalidCep: true });
          }
        },
        error: (error) => {
          this.showCepError('Erro ao buscar CEP. Tente novamente.');
          console.error('Erro na busca do CEP:', error);
        }
      });

    } catch (error) {
      console.error('Erro no searchCep:', error);
      this.showCepError('Erro inesperado. Tente novamente.');
    }
  }

  private async showCepError(message: string) {
    const alert = await this.alertController.create({
      header: 'Erro na busca',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!field && field.invalid && (field.touched || field.dirty);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field?.errors) return '';
    if (field.errors['required'])
      return 'Campo obrigatório';
    if (field.errors['email'])
      return 'E-mail inválido';
    if (field.errors['minlength'])
      return 'Campo inválido';
    if (field.errors['requiredTrue'])
      return 'Aceite os termos';
    return 'Campo inválido';
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    if (this.registerForm.invalid)
      return;

    const raw = this.registerForm.getRawValue();

    const userData: UserRequest = {
      name: raw.name,
      lastName: raw.lastname,
      email: raw.email,
      phone: raw.phone.replace(/\D/g, ''),
      address: raw.address,
      neighborhood: raw.neighborhood,
      city: raw.city,
      stateId: raw.state,
      cep: raw.cep.replace(/\D/g, ''),
      password: raw.password
    };

    try {
      await this.userService.createUser(userData).toPromise();
      this.sessionService.setGenericKey({ email: raw.email }, 'pendingUser');
      this.router.navigate(['/validate-code']);
    } catch (response: any) {
      const message =
        response?.error?.message ||
        response?.error ||
        'Erro ao criar usuário';

      await this.toastService.error(message);
    }
  }
}