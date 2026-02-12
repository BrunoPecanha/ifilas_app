import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NavController, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { CategoryModel } from 'src/models/category-model';
import { addressResponse } from 'src/models/responses/address-response';
import { CategoryResponse } from 'src/models/responses/category-response';
import { StoreModel } from 'src/models/store-model';
import { UserModel } from 'src/models/user-model';
import { CategoryService } from 'src/services/category.service';
import { GeoLocateService } from 'src/services/geo-locate.service';
import { SessionService } from 'src/services/session.service';
import { StatesService } from 'src/services/states.service';
import { StoresService } from 'src/services/stores.service';

@Component({
  selector: 'app-company-configurations',
  templateUrl: './company-configurations.page.html',
  styleUrls: ['./company-configurations.page.scss'],
})
export class CompanyConfigurationsPage implements OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('wallpaperInput') wallpaperInput!: ElementRef<HTMLInputElement>;

  cadastroForm!: FormGroup;
  logoOreview: any;
  wallpaperPreview: any;
  sending = false;
  sent = false;
  releaseOrdersBeforeGoToQueue = false;
  useAgenda = false;
  category: number | null = null;
  cnpj: string | null = null;
  name: string | null = null;
  address: string | null = null;
  number: string | number = 0;
  timeRemoval: number | null = null;
  states: Array<{ id: string, name: string }> = [];
  categories: CategoryModel[] = [];
  loading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  saved = false;
  fallbackRoute = '/role-registration';
  store: StoreModel | null = null;
  user: UserModel | null = null;
  searchingCep = false;
  serverErrors: { [key: string]: string } = {};
  private subscriptions: Subscription[] = [];

  weekDays = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo'];

  constructor(
    private fb: FormBuilder,
    private stateService: StatesService,
    private categoryService: CategoryService,
    private storeService: StoresService,
    private navCtrl: NavController,
    public sessionService: SessionService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private geoLocalizationService: GeoLocateService,
    private alertController: AlertController
  ) {
    this.initializeForm();
    this.loadStates();
    this.loadCategories();
  }


  ionViewWillEnter() {
    this.user = this.sessionService.getUser();

    if (this.user?.profile === 2) {
      this.store = this.sessionService.getStore();

      if (this.store) {
        this.loadStoreData(this.store.id);
      }
    }
  };

  ngOnDestroy() {
    this.cleanupResources();
  }

  initializeForm() {
    this.cadastroForm = this.fb.group({
      ownerId: this.user?.id,
      logo: [null],
      cnpj: [''],
      name: ['', Validators.required],
      address: ['', Validators.required],
      number: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      categoryId: [null, Validators.required],
      phoneNumber: [''],
      website: [''],
      neighborhood: [''],
      cep: ['', [Validators.required, this.cepValidator()]],
      facebook: [''],
      instagram: [''],
      youtube: [''],
      openingHours: this.fb.array(
        this.weekDays.map(day => this.createHorarioForm(day))
      ),
      openAutomatic: [false],
      useAgenda: [false],
      attendSimultaneously: [false],
      acceptOtherQueues: [false],
      answerOutOfOrder: [false],
      answerScheduledTime: [false],
      whatsAppNotice: [false],
      timeRemoval: [0],
      releaseOrdersBeforeGetsQueued: [false],
      endServiceWithQRCode: [false],
      startServiceWithQRCode: [false],
      hideAmountsWhenTransferringCustomers: [false],
      allowTransfer: [false],
      shareQueue: [false],
      wallPaper: [null],
      inCaseFailureAcceptFinishWithoutQRCode: [false],
      approveAppointmentsThatExceedTheTime: [false],
      storeSubtitle: [''],
      highLights: this.fb.array([])
    });

    this.cadastroForm.get('address')?.disable();
    this.cadastroForm.get('neighborhood')?.disable();
    this.cadastroForm.get('city')?.disable();
    this.cadastroForm.get('state')?.disable();

    this.cadastroForm.get('openAutomatic')?.disable();
    this.cadastroForm.get('attendSimultaneously')?.disable();
    this.cadastroForm.get('acceptOtherQueues')?.disable();
    this.cadastroForm.get('answerOutOfOrder')?.disable();
    this.cadastroForm.get('answerScheduledTime')?.disable();
    this.cadastroForm.get('timeRemoval')?.disable();

    this.setupQRCodeToggleListeners();
    this.setupOpeningHoursValidation();
  }

  private setupQRCodeToggleListeners() {
    const startQRControl = this.cadastroForm.get('startServiceWithQRCode');
    const endQRControl = this.cadastroForm.get('endServiceWithQRCode');

    startQRControl?.valueChanges.subscribe(value => {
      if (value && endQRControl?.value) {
        endQRControl.setValue(false, { emitEvent: false });
      }
    });

    endQRControl?.valueChanges.subscribe(value => {
      if (value && startQRControl?.value) {
        startQRControl.setValue(false, { emitEvent: false });
      }
    });
  }

  private cleanupResources() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    this.resetFormAndPreviews();
  }
  
  cepValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const cep = control.value?.replace(/\D/g, '') || '';
      return (!cep || cep.length !== 8) ? { invalidCep: true } : null;
    };
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.cadastroForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.cadastroForm.get(fieldName);

    if (!field || !field.errors) 
      return '';

    if (this.serverErrors[fieldName]) {
      return this.serverErrors[fieldName];
    }

    const errors = field.errors;

    if (errors['required']) return 'Este campo é obrigatório';
    if (errors['email']) return 'Email inválido';
    if (errors['minlength']) return `Mínimo de ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `Máximo de ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['invalidCnpj']) return 'CNPJ inválido';
    if (errors['invalidCep']) return 'CEP inválido';

    return 'Campo inválido';
  }

  private resetFormAndPreviews() {
    this.cadastroForm.reset({
      ownerId: 0,
      openAutomatic: false,
      attendSimultaneously: false,
      acceptOtherQueues: false,
      answerOutOfOrder: false,
      answerScheduledTime: false,
      whatsAppNotice: false,
      useAgenda: false
    });

    const openingHoursArray = this.cadastroForm.get('openingHours') as FormArray;
    while (openingHoursArray.length) {
      openingHoursArray.removeAt(0);
    }
    this.weekDays.forEach(day => {
      openingHoursArray.push(this.createHorarioForm(day));
    });

    const highlightsArray = this.cadastroForm.get('highLights') as FormArray;
    while (highlightsArray.length) {
      highlightsArray.removeAt(0);
    }

    this.logoOreview = null;
    this.wallpaperPreview = null;

    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    if (this.wallpaperInput?.nativeElement) {
      this.wallpaperInput.nativeElement.value = '';
    }

    this.successMessage = null;
    this.errorMessage = null;
    this.saved = false;
    this.sending = false;
    this.loading = false;
    this.store = null;
  }

  createHorarioForm(weekday: string): FormGroup {
    return this.fb.group({
      weekday: [weekday],
      activated: [false],
      start: [null],
      end: [null]
    });
  }

  get highLights(): FormArray {
    return this.cadastroForm.get('highLights') as FormArray;
  }

  getBack() {
    this.navCtrl.back();
  }

  loadStoreData(storeId: number): void {
    this.loading = true;
    this.storeService.getStoreById(storeId).subscribe({
      next: (response) => {

        if (response.valid && response.data) {
          this.populateFormForEdition(response.data);
        } else {
          console.error('Falha ao carregar dados da loja:', response.message);
          this.errorMessage = 'Falha ao carregar dados da loja.';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados da loja:', error);
        this.errorMessage = 'Erro ao carregar dados da loja.';
        this.loading = false;
      }
    });
  }

  private populateFormForEdition(storeData: StoreModel): void {
    this.cadastroForm.patchValue({
      ownerId: storeData.ownerId === 0 ? this.user?.id : storeData.ownerId,
      cnpj: storeData.cnpj,
      name: storeData.name,
      hideAmountsWhenTransferringCustomers: storeData.hideAmountsWhenTransferringCustomers,
      approveAppointmentsThatExceedTheTime: storeData.approveAppointmentsThatExceedTheTime,
      allowTransfer: storeData.allowTransfer,
      cep: storeData.cep || '',
      address: storeData.address || '',
      number: storeData.number || '',
      neighborhood: storeData.neighborhood || '',
      city: storeData.city,
      state: storeData.state,
      categoryId: storeData.categoryId,
      phoneNumber: storeData.phoneNumber,
      website: storeData.webSite,
      facebook: storeData.facebook,
      instagram: storeData.instagram,
      youtube: storeData.youtube,
      openAutomatic: storeData.openAutomatic,
      attendSimultaneously: storeData.attendSimultaneously,
      acceptOtherQueues: storeData.acceptOtherQueues,
      answerOutOfOrder: storeData.answerOutOfOrder,
      answerScheduledTime: storeData.answerScheduledTime,
      whatsAppNotice: storeData.whatsAppNotice,
      timeRemoval: storeData.timeRemoval,
      storeSubtitle: storeData.storeSubtitle,
      releaseOrdersBeforeGetsQueued: storeData.releaseOrdersBeforeGetsQueued,
      endServiceWithQRCode: storeData.endServiceWithQRCode,
      startServiceWithQRCode: storeData.startServiceWithQRCode,
      shareQueue: storeData.shareQueue,
      inCaseFailureAcceptFinishWithoutQRCode: storeData.inCaseFailureAcceptFinishWithoutQRCode
    });

    this.setupQRCodeToggleListeners();


    if (storeData.logoPath) {
      this.logoOreview = storeData.logoPath;
    }
    if (storeData.wallPaperPath) {
      this.wallpaperPreview = storeData.wallPaperPath;
    }

    const openingHoursArray = this.cadastroForm.get('openingHours') as FormArray;

    if (openingHoursArray.length !== this.weekDays.length) {
      console.error('O número de dias no formArray não corresponde aos dias da semana');
      return;
    }

    storeData.openingHours?.forEach((hours: any) => {
      const normalizedWeekDay = hours.weekDay.trim().toLowerCase();
      const dayIndex = this.weekDays.findIndex(day =>
        day.trim().toLowerCase() === normalizedWeekDay
      );

      if (dayIndex !== -1) {
        const dayGroup = openingHoursArray.at(dayIndex) as FormGroup;

        const hasHours = hours.start && hours.end;

        dayGroup.patchValue({
          activated: hasHours ? true : hours.activated,
          start: hours.start?.substring(0, 5) || '',
          end: hours.end?.substring(0, 5) || ''
        });

        dayGroup.get('activated')?.updateValueAndValidity();
      }
    });

    this.setupOpeningHoursValidation();

    const highlightsArray = this.cadastroForm.get('highLights') as FormArray;
    highlightsArray.clear();
    if (storeData.highLights && storeData.highLights.length > 0) {
      storeData.highLights.forEach((highlight: any) => {
        highlightsArray.push(this.fb.group({
          icon: highlight.icon?.replace('-outline', '') || '',
          phrase: highlight.phrase || ''
        }));
      });
    }
  }

  adicionarIconeFrase() {
    this.highLights.push(this.fb.group({
      icon: [''],
      phrase: [''],
    }));
  }

  async searchCep() {
    const cepControl = this.cadastroForm.get('cep');
    if (!cepControl || cepControl.invalid)
      return;

    const cep = cepControl.value.replace(/\D/g, '');
    if (cep.length !== 8)
      return;

    this.searchingCep = true;
    let loading: HTMLIonLoadingElement | null = null;

    try {
      loading = await this.loadingController.create({
        message: 'Buscando CEP...',
        duration: 10000
      });
      await loading.present();

      this.geoLocalizationService.getAddressByCep(cep).subscribe({
        next: (response: addressResponse) => {
          if (loading) {
            loading.dismiss();
            loading = null;
          }

          if (response.valid && response.data) {
            this.cadastroForm.get('address')?.enable();
            this.cadastroForm.get('neighborhood')?.enable();
            this.cadastroForm.get('city')?.enable();
            this.cadastroForm.get('state')?.enable();

            this.cadastroForm.patchValue({
              address: response.data.lagradouro,
              neighborhood: response.data.bairro,
              city: response.data.localidade,
              state: response.data.uf || response.data.estado
            });

            this.cadastroForm.get('address')?.disable();
            this.cadastroForm.get('neighborhood')?.disable();
            this.cadastroForm.get('city')?.disable();
            this.cadastroForm.get('state')?.disable();
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

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response: CategoryResponse) => {
        if (response.valid && response.data) {
          this.categories = response.data.map(category => ({
            id: category.id,
            name: category.name,
            imgPath: category.imgPath
          }));
        } else {
          console.warn('Resposta inválida ao carregar categorias');
          this.categories = [];
        }
      },
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
        this.categories = [];
      }
    });
  }

  loadStates() {
    this.states = this.stateService.getStates();
  }

  removerIconeFrase(index: number) {
    this.highLights.removeAt(index);
  }

  getHorarioFormGroup(index: number): FormGroup {
    return (this.cadastroForm.get('openingHours') as FormArray).at(index) as FormGroup;
  }

  selecionarImagem() {
    this.fileInput.nativeElement.click();
  }

  onImagemSelecionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.logoOreview = reader.result;
      };
      reader.readAsDataURL(file);

      this.cadastroForm.patchValue({
        logo: file
      });
    }
  }

  selecionarWallpaper() {
    this.wallpaperInput.nativeElement.click();
  }

  onWallpaperSelecionado(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.wallpaperPreview = reader.result;
      };
      reader.readAsDataURL(file);

      this.cadastroForm.patchValue({
        wallPaper: file
      });
    }
  }

  removerWallpaper() {
    this.wallpaperPreview = null;
    if (this.wallpaperInput) {
      this.wallpaperInput.nativeElement.value = '';
    }
  }

  private logInvalidControls(control: AbstractControl, prefix: string = ''): void {
    if (control instanceof FormGroup) {
      Object.keys(control.controls).forEach(key => {
        this.logInvalidControls(control.get(key)!, `${prefix}${key}.`);
      });
    }
    else if (control instanceof FormArray) {
      control.controls.forEach((ctrl, index) => {
        this.logInvalidControls(ctrl, `${prefix}[${index}].`);
      });
    }
    else {
      console.log(`Campo: ${prefix.slice(0, -1)} | Valid: ${control.valid} | Erros:`, control.errors, '| Valor:', control.value);
    }
  }

  formatCNPJ(event: any) {
    let valor = event.detail.value;
    valor = valor.replace(/\D/g, '');
    valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
    valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
    this.cadastroForm.get('cnpj')?.setValue(valor, { emitEvent: false });
  }

  async save(): Promise<void> {
    this.successMessage = null;
    this.errorMessage = null;
    this.saved = false;

    this.cadastroForm.get('address')?.enable();
    this.cadastroForm.get('neighborhood')?.enable();
    this.cadastroForm.get('city')?.enable();
    this.cadastroForm.get('state')?.enable();

    // const cnpjControl = this.cadastroForm.get('cnpj');
    // if (cnpjControl && cnpjControl.value) {
    //   const cnpjLimpo = cnpjControl.value.replace(/[\.\/\-]/g, '');
    //   cnpjControl.setValue(cnpjLimpo);
    // }

    const cepControl = this.cadastroForm.get('cep');
    if (cepControl && cepControl.value) {
      const cepLimpo = cepControl.value.replace(/\D/g, '');
      cepControl.setValue(cepLimpo);
    }

    if (this.cadastroForm.invalid) {
      this.errorMessage = 'Preencha todos os campos obrigatórios.';
      this.markFormGroupTouched(this.cadastroForm);

      this.cadastroForm.get('address')?.disable();
      this.cadastroForm.get('neighborhood')?.disable();
      this.cadastroForm.get('city')?.disable();
      this.cadastroForm.get('state')?.disable();

      return;
    }

    if (!(await this.validateForm(this.cadastroForm))) {
      this.cadastroForm.get('address')?.disable();
      this.cadastroForm.get('neighborhood')?.disable();
      this.cadastroForm.get('city')?.disable();
      this.cadastroForm.get('state')?.disable();
      return;
    }

    if (this.cadastroForm.valid) {
      this.sending = true;
      this.loading = true;

      this.cadastroForm.get('address')?.enable();
      this.cadastroForm.get('neighborhood')?.enable();
      this.cadastroForm.get('city')?.enable();
      this.cadastroForm.get('state')?.enable();

      const storeData = this.storeService.prepareStoreData(this.cadastroForm, this.user!.id);
      const storeId = this.store ? this.store.id : null;

      const observable = storeId
        ? this.storeService.updateStore(storeId, storeData)
        : this.storeService.createStore(storeData);

      observable.subscribe({
        next: (response) => {
          this.sending = false;
          this.loading = false;

          this.cadastroForm.get('address')?.disable();
          this.cadastroForm.get('neighborhood')?.disable();
          this.cadastroForm.get('city')?.disable();
          this.cadastroForm.get('state')?.disable();

          if (response.valid) {
            this.saved = true;
            this.successMessage = storeId
              ? 'Loja atualizada com sucesso!'
              : 'Loja cadastrada com sucesso!';

            const updatedStoreId = storeId ?? response.data?.id;

            if (updatedStoreId) {
              this.refreshStoreSession(updatedStoreId);
            }
          } else {
            this.errorMessage = response.message || 'Falha ao salvar loja. Por favor, tente novamente.';
          }
        },
        error: (error) => {
          this.sending = false;
          this.loading = false;

          this.cadastroForm.get('address')?.disable();
          this.cadastroForm.get('neighborhood')?.disable();
          this.cadastroForm.get('city')?.disable();
          this.cadastroForm.get('state')?.disable();

          this.errorMessage = error;
        }
      });
    } else {
      this.errorMessage = 'Por favor, preencha todos os campos obrigatórios.';

      this.cadastroForm.get('address')?.disable();
      this.cadastroForm.get('neighborhood')?.disable();
      this.cadastroForm.get('city')?.disable();
      this.cadastroForm.get('state')?.disable();
    }
  }

  private refreshStoreSession(storeId: number) {
    this.storeService.getStoreById(storeId).subscribe({
      next: (response) => {
        if (response.valid && response.data) {
          this.sessionService.setStore(response.data);
        }
      },
      error: (err) => {
        console.error('Erro ao atualizar session da loja', err);
      }
    });
  }

  async validateForm(formGroup: FormGroup) {
    for (const key of Object.keys(formGroup.controls)) {
      const control = formGroup.get(key);

      if (control && control.invalid) {
        await this.presentToast(`O campo "${this.getLabelCampo(key)}" está inválido.`);

        control.markAsTouched();
        control.updateValueAndValidity();

        return false;
      }
    }
    return true;
  }

  getLabelCampo(campo: string): string {
    const labels: any = {
      nome: 'Nome',
      email: 'E-mail',
      telefone: 'Telefone',
      senha: 'Senha'
    };
    return labels[campo] || campo;
  }

  async presentToast(mensagem: string) {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      position: 'top',
      color: 'warning'
    });
    toast.present();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  formatPhoneNumber(phoneNumber: any): string | null {
    const cleaned = phoneNumber.replace(/\D/g, '');

    if (cleaned.length < 10 || cleaned.length > 11) {
      return null;
    }

    const isMobile = cleaned.length === 11;

    if (isMobile) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const phoneRegex = /^(\d{2})([2-5]\d{7}|9\d{8})$/;

    return phoneRegex.test(cleaned);
  }

  formatarTelefone(event: any) {
    let valor = event.detail.value;
    valor = valor.replace(/\D/g, '');

    if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})/, '($1) ');
    }

    if (valor.length > 10) {
      valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
    } else if (valor.length > 6) {
      valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
    }

    this.cadastroForm.get('phone')?.setValue(valor, { emitEvent: false });
  }

  formatAndValidatePhone(phoneNumber: string): {
    formatted: string | null;
    isValid: boolean;
  } {
    const formatted = this.formatPhoneNumber(phoneNumber);
    const isValid = this.validatePhoneNumber(phoneNumber);

    return {
      formatted,
      isValid
    };
  }

  setupOpeningHoursValidation() {
    const openingHoursArray = this.cadastroForm.get('openingHours') as FormArray;

    openingHoursArray.controls.forEach((group: import('@angular/forms').AbstractControl) => {
      const formGroup = group as FormGroup;
      const activatedCtrl = formGroup.get('activated');

      activatedCtrl?.valueChanges.subscribe((activated: boolean) => {
        const startCtrl = formGroup.get('start');
        const endCtrl = formGroup.get('end');

        if (activated) {
          startCtrl?.setValidators([Validators.required]);
          endCtrl?.setValidators([Validators.required]);
        } else {
          startCtrl?.reset();
          endCtrl?.reset();
          startCtrl?.clearValidators();
          endCtrl?.clearValidators();
        }

        startCtrl?.updateValueAndValidity();
        endCtrl?.updateValueAndValidity();
      });
    });
  }
}