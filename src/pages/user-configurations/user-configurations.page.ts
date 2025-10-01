import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, NavController, ToastController } from '@ionic/angular';
import { addressResponse } from 'src/models/responses/address-response';
import { UserModel } from 'src/models/user-model';
import { GeoLocateService } from 'src/services/geo-locate.service';
import { SessionService } from 'src/services/session.service';
import { UserService } from 'src/services/user-service';

@Component({
  selector: 'app-user-configurations',
  templateUrl: './user-configurations.page.html',
  styleUrls: ['./user-configurations.page.scss'],
})
export class UserConfigurationsPage {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('wallpaperInput') wallpaperInput!: ElementRef<HTMLInputElement>;

  cadastroForm: FormGroup;
  imagemPreview: string | null = null;
  wallpaperPreview: string | null = null;
  enviando = false;
  enviado = false;
  selectedImageFile: File | null = null;
  user: UserModel = {} as UserModel;
  searchingCep = false;
  serverErrors: { [key: string]: string } = {};

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private userService: UserService,
    private sessionService: SessionService,
    private geoLocateService: GeoLocateService,
    private loadingController: LoadingController) {
    this.cadastroForm = this.fb.group({
      cpf: ['', [Validators.required, Validators.minLength(11)]],
      name: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      address: [''],
      cep: ['', [Validators.required, Validators.minLength(8)]],
      number: [''],
      password: [''],
      subtitle: [''],
      email: ['', [Validators.required, Validators.email]],
      ddd: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.minLength(9)]],
      city: [''],
      neighborhood: [''],
      stateId: [''],
      servicesProvided: [''],
      aceptMesageFromOtherUsers: [false],
      acceptAwaysMinorQueue: [false],
      deleteAccount: [false],
      useAgenda: [false]
    });

    this.user = this.sessionService.getUser();
    this.fillForm();
  }

  brazilianStates = [
    { acronym: 'AC', name: 'Acre' },
    { acronym: 'AL', name: 'Alagoas' },
    { acronym: 'AP', name: 'Amapá' },
    { acronym: 'AM', name: 'Amazonas' },
    { acronym: 'BA', name: 'Bahia' },
    { acronym: 'CE', name: 'Ceará' },
    { acronym: 'DF', name: 'Distrito Federal' },
    { acronym: 'ES', name: 'Espírito Santo' },
    { acronym: 'GO', name: 'Goiás' },
    { acronym: 'MA', name: 'Maranhão' },
    { acronym: 'MT', name: 'Mato Grosso' },
    { acronym: 'MS', name: 'Mato Grosso do Sul' },
    { acronym: 'MG', name: 'Minas Gerais' },
    { acronym: 'PA', name: 'Pará' },
    { acronym: 'PB', name: 'Paraíba' },
    { acronym: 'PR', name: 'Paraná' },
    { acronym: 'PE', name: 'Pernambuco' },
    { acronym: 'PI', name: 'Piauí' },
    { acronym: 'RJ', name: 'Rio de Janeiro' },
    { acronym: 'RN', name: 'Rio Grande do Norte' },
    { acronym: 'RS', name: 'Rio Grande do Sul' },
    { acronym: 'RO', name: 'Rondônia' },
    { acronym: 'RR', name: 'Roraima' },
    { acronym: 'SC', name: 'Santa Catarina' },
    { acronym: 'SP', name: 'São Paulo' },
    { acronym: 'SE', name: 'Sergipe' },
    { acronym: 'TO', name: 'Tocantins' }
  ];

  private fillForm() {
    this.cadastroForm.patchValue({
      cpf: this.user.cpf,
      name: this.user.name,
      lastName: this.user.lastName,
      address: this.user.address,
      number: this.user.number,
      ddd: this.user.ddd,
      cep: this.user.cep,
      phone: this.user.phone,
      city: this.user.city,
      neighborhood: this.user.neighborhood,
      stateId: this.user.stateId,
      email: this.user.email,
      subtitle: this.user.subtitle,
      servicesProvided: this.user.servicesProvided,
      acceptAwaysMinorQueue: this.user.acceptAwaysMinorQueue
    });

    if (this.user.imageUrl) {
      this.imagemPreview = this.user.imageUrl;
    }
  }

  selectImage() {
    this.fileInput.nativeElement.click();
  }

  selectWallpaper() {
    this.wallpaperInput.nativeElement.click();
  }

  onImagemSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedImageFile = file;
      this.createImagePreview(file, 'imagemPreview');
    }
  }

  onWallpaperSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.createImagePreview(file, 'wallpaperPreview');
    }
  }

  private createImagePreview(file: File, property: 'imagemPreview' | 'wallpaperPreview') {
    const reader = new FileReader();
    reader.onload = (e) => {
      this[property] = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removerWallpaper() {
    this.wallpaperPreview = null;
    this.wallpaperInput.nativeElement.value = '';
  }
  
  getErrorMessage(fieldName: string): string {
    const field = this.cadastroForm.get(fieldName);

    if (!field || !field.errors) return '';

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

  formatCPF(event: any) {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length > 3) {
      value = value.substring(0, 3) + '.' + value.substring(3);
    }
    if (value.length > 7) {
      value = value.substring(0, 7) + '.' + value.substring(7);
    }
    if (value.length > 11) {
      value = value.substring(0, 11) + '-' + value.substring(11);
    }

    this.cadastroForm.get('cpf')?.setValue(value, { emitEvent: false });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.cadastroForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  async searchCep() {    
    const cepControl = this.cadastroForm.get('cep');
    if (!cepControl || cepControl.invalid) return;

    const cep = cepControl.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    this.searchingCep = true;
    let loading: HTMLIonLoadingElement | null = null;

    try {
      loading = await this.loadingController.create({
        message: 'Buscando CEP...',
        duration: 10000
      });
      await loading?.present();

      
      this.geoLocateService.getAddressByCep(cep).subscribe({
        next: (response: addressResponse) => {
          if (loading) {
            loading.dismiss();
            loading = null;
          }

          if (response.valid && response.data) {
            this.cadastroForm.patchValue({
              address: response.data.lagradouro,
              neighborhood: response.data.bairro,
              city: response.data.localidade,
              stateId: response.data.uf || response.data.estado
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
    const alert = await this.alertCtrl.create({
      header: 'Erro na busca',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async save() {
    if (this.cadastroForm.invalid) {
      Object.keys(this.cadastroForm.controls).forEach(key => {
        this.cadastroForm.get(key)?.markAsTouched();
      });

      const toast = await this.toastCtrl.create({
        message: 'Preencha todos os campos obrigatórios corretamente',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      return;
    }

    const formValue = this.cadastroForm.value;
    const userData = {
      id: this.user.id,
      cpf: formValue.cpf.replace(/\D/g, ''),
      name: formValue.name,
      lastName: formValue.lastName,
      ddd: formValue.ddd,
      phone: formValue.phone,
      cep: formValue.cep.replace(/\D/g, ''),
      address: formValue.address,
      number: formValue.number,
      city: formValue.city,
      stateId: formValue.stateId,
      email: formValue.email,
      subtitle: formValue.subtitle,
      servicesProvided: formValue.servicesProvided,
      acceptAwaysMinorQueue: formValue.acceptAwaysMinorQueue,
      deleteAccount: formValue.deleteAccount || false,
      password: formValue.password
    };

    this.enviando = true;

    try {
      const formData = this.buildFormData(userData, this.selectedImageFile);
      const response = await this.userService.updateUser(formData).toPromise();

      if (response?.valid) {
        const updatedUser = {
          ...this.user,
          ...userData,
          neighborhood: formValue.neighborhood, 
          imageUrl: response.data.imageUrl || this.user.imageUrl
        };

        this.sessionService.setUser(updatedUser);
        this.showSuccessToast('Perfil atualizado com sucesso!');
      } else {
        throw new Error(response?.message || 'Falha ao atualizar perfil');
      }
    } catch (error: any) {
      console.error('Erro ao enviar dados:', error);

      if (error?.status === 400 || error?.status === 409 || error?.status === 422) {
        if (error.error?.errors && Array.isArray(error.error.errors)) {
          error.error.errors.forEach((err: any) => {
            if (err.field) {
              this.serverErrors[err.field] = err.message;
              const control = this.cadastroForm.get(err.field);
              if (control) {
                control.setErrors({ serverError: true });
                control.markAsTouched();
              }
            }
          });
        }

        if (Object.keys(this.serverErrors).length === 0) {
          this.showErrorToast(error.error?.message || 'Erro ao processar a requisição');
        }
      } else {
        this.showErrorToast('Erro ao enviar dados. Tente novamente.');
      }
    } finally {
      this.enviando = false;
      this.userService.notifyProfileUpdate();
    }
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  getBack() {
    this.navCtrl.back();
  }

  private buildFormData(userData: any, imageFile?: File | null): FormData {
    const formData = new FormData();

    if (imageFile) {
      formData.append('RemoveProfileImage', 'false');
      formData.append('ProfileImage', imageFile, imageFile.name);
    }
    else if (!imageFile && this.imagemPreview)
      formData.append('RemoveProfileImage', 'false');
    else
      formData.append('RemoveProfileImage', 'true');

    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        const value = typeof userData[key] === 'boolean' ? String(userData[key]) : userData[key];
        formData.append(key, value);
      }
    });

    return formData;
  }

  async onDeleteAccountToggle(event: any) {
    if (event.detail.checked) {
      event.preventDefault();

      const alert = await this.alertCtrl.create({
        header: 'Confirmar exclusão',
        message: 'Esta ação é irreversível...',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => {
              this.cadastroForm.get('DeleteAccount')?.setValue(false, { emitEvent: false });
            }
          },
          {
            text: 'Confirmar',
            handler: () => {
              this.cadastroForm.get('DeleteAccount')?.setValue(true, { emitEvent: false });
            }
          }
        ]
      });
      await alert.present();
    }
  }

  logout() {
    this.navCtrl.navigateRoot('/splash');

    this.toastCtrl.create({
      message: 'Sua conta foi deletada com sucesso',
      duration: 3000,
      color: 'success',
      position: 'top'
    }).then(toast => toast.present());
  }
}