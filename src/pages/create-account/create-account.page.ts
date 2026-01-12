import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { UserRequest } from 'src/models/requests/user-request';
import { UserService } from 'src/services/user-service';
import { GeoLocateService } from 'src/services/geo-locate.service';
import { addressResponse } from 'src/models/responses/address-response';
import { SessionService } from 'src/services/session.service';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.page.html',
  styleUrls: ['./create-account.page.scss'],
})
export class CreateAccountPage implements OnInit {
  registerForm: FormGroup;
  loading = false;
  serverErrors: { [key: string]: string } = {};
  searchingCep = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private geLocation: GeoLocateService,
    private sessionService: SessionService
  ) {
    this.registerForm = this.createForm();
  }

  ngOnInit() {
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      cpf: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(14)]],
      cep: ['', [Validators.required, this.cepValidator()]],
      address: ['', [Validators.required]],
      number: [''],
      neighborhood: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      termsAccepted: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  cpfValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const cpf = control.value?.replace(/\D/g, '') || '';

      if (!cpf || cpf.length !== 11) {
        return { invalidCpf: true };
      }

      if (/^(\d)\1{10}$/.test(cpf)) {
        return { invalidCpf: true };
      }

      let sum = 0;
      let remainder;

      for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
      }

      remainder = (sum * 10) % 11;
      if ((remainder === 10) || (remainder === 11)) {
        remainder = 0;
      }
      if (remainder !== parseInt(cpf.substring(9, 10))) {
        return { invalidCpf: true };
      }

      sum = 0;
      for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
      }

      remainder = (sum * 10) % 11;
      if ((remainder === 10) || (remainder === 11)) {
        remainder = 0;
      }
      if (remainder !== parseInt(cpf.substring(10, 11))) {
        return { invalidCpf: true };
      }

      return null;
    };
  }

  cepValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const cep = control.value?.replace(/\D/g, '') || '';

      if (!cep || cep.length !== 8) {
        return { invalidCep: true };
      }

      return null;
    };
  }

  passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    return password && confirmPassword && password.value !== confirmPassword.value
      ? { mismatch: true }
      : null;
  };

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);

    if (!field || !field.errors) 
      return '';

    if (this.serverErrors[fieldName]) {
      return this.serverErrors[fieldName];
    }

    const errors = field.errors;

    if (errors['required']) {
      return 'Este campo é obrigatório';
    } else if (errors['email']) {
      return 'Email inválido';
    } else if (errors['minlength']) {
      return `Mínimo de ${errors['minlength'].requiredLength} caracteres`;
    } else if (errors['invalidCpf']) {
      return 'CPF inválido';
    } else if (errors['invalidCep']) {
      return 'CEP inválido';
    } else if (fieldName === 'termsAccepted' && errors['required']) {
      return 'Você deve aceitar os termos';
    }

    return 'Campo inválido';
  }

  formatPhone(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    value = value.substring(0, 11);

    let formatted = '';
    if (value.length > 0) {
      formatted = `(${value.substring(0, 2)}) `;
    }
    if (value.length > 2) {
      formatted += value.substring(2, 7);
    }
    if (value.length > 7) {
      formatted += `-${value.substring(7, 11)}`;
    }

    this.registerForm.patchValue({ phone: formatted });
  }

  formatCPF(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) {
      value = value.substring(0, 11);
    }

    if (value.length > 3) {
      value = value.substring(0, 3) + '.' + value.substring(3);
    }
    if (value.length > 7) {
      value = value.substring(0, 7) + '.' + value.substring(7);
    }
    if (value.length > 11) {
      value = value.substring(0, 11) + '-' + value.substring(11);
    }

    this.registerForm.patchValue({ cpf: value });
  }

  formatCep(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 8) {
      value = value.substring(0, 8);
    }

    if (value.length > 5) {
      value = value.substring(0, 5) + '-' + value.substring(5);
    }

    this.registerForm.patchValue({ cep: value });
  }

  async searchCep() {
    const cepControl = this.registerForm.get('cep');
    if (!cepControl || cepControl.invalid) {
      return;
    }

    const cep = cepControl.value.replace(/\D/g, '');
    if (cep.length !== 8) {
      return;
    }

    this.searchingCep = true;
    let loading: HTMLIonLoadingElement | null = null;

    try {
      loading = await this.loadingController.create({
        message: 'Buscando CEP...',
        duration: 10000
      });
      await loading.present();

      this.geLocation.getAddressByCep(cep).subscribe({
        next: (response: addressResponse) => {
          if (loading) {
            loading.dismiss();
            loading = null;
          }

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
          if (loading) {
            loading.dismiss();
            loading = null;
          }
          this.showCepError('Erro ao buscar CEP. Tente novamente.');
          console.error('Erro na busca do CEP:', error);
        }
      });

    } catch (error) {
      console.error('Erro no searchCep:', error);
      this.showCepError('Erro inesperado. Tente novamente.');
    } finally {
      this.searchingCep = false;

      if (loading) {
        loading.dismiss();
      }
    }
  }

  private async showCepError(message: string) {
    const alert = await this.alertController.create({
      header: 'Erro na busca',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

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
    const phoneDigits = formValue.phone.replace(/\D/g, '');
    const cpfDigits = formValue.cpf.replace(/\D/g, '');
    const cepDigits = formValue.cep.replace(/\D/g, '');

    let userData: UserRequest = {
      name: formValue.name,
      lastName: formValue.lastname,
      email: formValue.email,
      phone: phoneDigits,
      cpf: cpfDigits,
      password: formValue.password,
      address: formValue.address,
      number: formValue.number,
      neighborhood: formValue.neighborhood,
      city: formValue.city,
      stateId: formValue.state,
      cep: cepDigits
    };

    try {
      await this.userService.createUser(userData).toPromise();

      this.sessionService.setGenericKey({ email: userData.email, newUser: true}, 'pendingUser');
      const alert = await this.alertController.create({
        header: 'Sucesso',
        message: 'Cadastro realizado com sucesso!',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              this.router.navigate(['/validate-code']);
            }
          }
        ],
      });
      await alert.present();
    } catch (err: any) {
      if (err?.status === 400 || err?.status === 409 || err?.status === 422) {
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          err.error.errors.forEach((error: any) => {
            if (error.field) {
              this.serverErrors[error.field] = error.message;

              const control = this.registerForm.get(error.field);
              if (control) {
                control.setErrors({ serverError: true });
                control.markAsTouched();
              }
            }
          });

          if (Object.keys(this.serverErrors).length > 0) {
            this.loading = false;
            return;
          }
        }

        const alert = await this.alertController.create({
          header: 'Erro',
          message: err.error?.message || 'Erro ao processar a requisição',
          buttons: ['OK']
        });
        await alert.present();

      } else {
        const alert = await this.alertController.create({
          header: 'Erro',
          message: 'Erro interno do servidor. Tente novamente.',
          buttons: ['OK']
        });
        await alert.present();
      }
    } finally {
      this.loading = false;
    }
  }
}