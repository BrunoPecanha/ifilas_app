import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { CategoryModel } from 'src/models/category-model';
import { CategoryResponse } from 'src/models/responses/category-response';
import { StoreModel } from 'src/models/store-model';
import { UserModel } from 'src/models/user-model';
import { CategoryService } from 'src/services/category.service';
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

  private subscriptions: Subscription[] = [];

  weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  constructor(
    private fb: FormBuilder,
    private stateService: StatesService,
    private categoryService: CategoryService,
    private storeService: StoresService,
    private navCtrl: NavController,
    public sessionService: SessionService,
    private toastController: ToastController
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
      cnpj: ['', Validators.required], 
      name: ['', Validators.required], 
      address: ['', Validators.required], 
      number: ['', Validators.required], 
      city: ['', Validators.required], 
      state: ['', Validators.required], 
      categoryId: [null, Validators.required],
      phoneNumber: [''],
      website: [''],
      facebook: [''],
      instagram: [''],
      youtube: [''],
      openingHours: this.fb.array(
        this.weekDays.map(day => this.createHorarioForm(day))
      ),
      openAutomatic: [false],
      attendSimultaneously: [false],
      acceptOtherQueues: [false],
      answerOutOfOrder: [false],
      answerScheduledTime: [false],
      whatsAppNotice: [false],
      timeRemoval: [0],
      releaseOrdersBeforeGetsQueued: [false],
      endServiceWithQRCode: [false],
      startServiceWithQRCode: [false],
      shareQueue: [false],
      wallPaper: [null],
      finishWithoutQrCodeInCaseFailure: [false],
      storeSubtitle: [''],
      highLights: this.fb.array([])
    });

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

  private resetFormAndPreviews() {
    this.cadastroForm.reset({
      ownerId: 1,
      openAutomatic: false,
      attendSimultaneously: false,
      acceptOtherQueues: false,
      answerOutOfOrder: false,
      answerScheduledTime: false,
      whatsAppNotice: false
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
      address: storeData.address,
      number: storeData.number || '',
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
      finishWithoutQrCodeInCaseFailure: storeData.inCaseFailureAcceptFinishWithoutQRCode
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

    const cnpjControl = this.cadastroForm.get('cnpj');
    if (cnpjControl && cnpjControl.value) {
      const cnpjLimpo = cnpjControl.value.replace(/[\.\/\-]/g, '');
      cnpjControl.setValue(cnpjLimpo);
    }

    if (this.cadastroForm.invalid) {
      this.errorMessage = 'Preencha todos os campos obrigatórios.';
      this.markFormGroupTouched(this.cadastroForm);
      return;
    }

    if (!(await this.validateForm(this.cadastroForm))) {
      return;
    }

    if (this.cadastroForm.valid) {
      this.sending = true;
      this.loading = true;

      const storeData = this.storeService.prepareStoreData(this.cadastroForm, this.user!.id);
      const storeId = this.store ? this.store.id : null;

      const observable = storeId
        ? this.storeService.updateStore(storeId, storeData)
        : this.storeService.createStore(storeData);

      observable.subscribe({
        next: (response) => {
          this.sending = false;
          this.loading = false;

          if (response.valid) {
            this.saved = true;
            this.successMessage = storeId
              ? 'Loja atualizada com sucesso!'
              : 'Loja cadastrada com sucesso!';

            if (!storeId) {
              this.navCtrl.navigateForward(`/company-configurations`);
            }
          } else {
            this.errorMessage = response.message || 'Falha ao salvar loja. Por favor, tente novamente.';
          }
        },
        error: (error) => {
          this.sending = false;
          this.loading = false;
          this.errorMessage = error;
        }
      });
    } else {
      this.errorMessage = 'Por favor, preencha todos os campos obrigatórios.';
      console.warn('Formulário inválido:');

      this.logInvalidControls(this.cadastroForm);
      this.markFormGroupTouched(this.cadastroForm);
    }
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