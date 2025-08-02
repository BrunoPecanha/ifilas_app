import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, NavController } from '@ionic/angular';
import { ServiceCategoryModel } from 'src/models/service-category-model';
import { ServiceModel } from 'src/models/service-model';
import { ServiceCategoryService } from 'src/services/service-category.service';
import { ServiceService } from 'src/services/services.service';
import { SessionService } from 'src/services/session.service';

@Component({
  selector: 'app-service-registration',
  templateUrl: './service-registration.page.html',
  styleUrls: ['./service-registration.page.scss'],
})
export class ServiceRegistrationPage implements OnInit {
  services: ServiceModel[] = [];
  filteredServices: ServiceModel[] = [];
  categories: ServiceCategoryModel[] = [];

  searchTerm = '';
  isInitialLoading = true;
  noRecordsFound = false;
  isSaving = false;

  serviceForm!: FormGroup;
  showForm = false;
  editingService: ServiceModel | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  store: any;

  constructor(
    private fb: FormBuilder,
    private session: SessionService,
    private categoryService: ServiceCategoryService,
    private serviceService: ServiceService,
    private navCtrl: NavController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.store = this.session.getStore();
    this.loadCategories();
    this.loadServices();
  }

  async loadServices() {
    this.isInitialLoading = true;
    try {
      const response = await this.serviceService.loadServicesByStore(this.store.id, false).toPromise();
      this.services = response?.data || [];
      this.filteredServices = [...this.services];
      this.noRecordsFound = this.services.length === 0;
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      this.noRecordsFound = true;
    } finally {
      this.isInitialLoading = false;
    }
  }

  async loadCategories() {
    try {
      const response = await this.categoryService.getServiceCategories().toPromise();
      this.categories = response?.data.map(cat => ({
        ...cat,
        icon: this.unicodeToEmoji(cat.icon)
      })) || [];
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }

  filterServices() {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredServices = [...this.services];
      return;
    }

    this.filteredServices = this.services.filter(service =>
      service.name.toLowerCase().includes(term) ||
      (service.description?.toLowerCase().includes(term)) ||
      (service.category?.name.toLowerCase().includes(term))
    );
  }

  startNewService() {
    this.editingService = null;
    this.openForm({
      name: '',
      description: '',
      price: '',
      duration: '00:30:00',
      imgPath: null,
      activated: true,
      variablePrice: false,
      variableTime: false,
      category: null,
    });
  }

  editService(service: ServiceModel) {
    this.editingService = service;
    const totalMinutes = typeof service.duration === 'string'
      ? this.timeSpanToMinutes(service.duration)
      : service.duration;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const priceFormatted = service.price?.toFixed(2).replace('.', ',') || '';
    this.previewUrl = service.imgPath;

    this.openForm({
      id: service.id,
      name: service.name,
      description: service.description,
      price: priceFormatted,
      durationHours: hours,
      durationMinutes: minutes,
      imgPath: service.imgPath,
      activated: service.activated,
      variablePrice: service.variablePrice,
      variableTime: service.variableTime,
      category: this.categories.find(c => c.id === service.category.id) || null,
    });
  }

  openForm(initialData: any) {
    this.serviceForm = this.fb.group({
      id: [initialData.id || null],
      name: [initialData.name, Validators.required],
      description: [initialData.description],
      category: [initialData.category, Validators.required],
      price: [initialData.price, Validators.required],
      durationHours: [initialData.durationHours || 0, [Validators.min(0)]],
      durationMinutes: [initialData.durationMinutes || 30, [Validators.min(0), Validators.max(59)]],
      image: [initialData.imgPath || null],
      activated: [initialData.activated],
      variablePrice: [initialData.variablePrice],
      variableTime: [initialData.variableTime],
    });

    this.showForm = true;
  }

  formatPrice(event: any) {
    let value = event.target.value || '';
    value = value.replace(/[^0-9,]/g, '');

    const parts = value.split(',');
    if (parts.length > 2) {
      value = parts[0] + ',' + parts[1];
    }
    if (parts.length === 2) {
      parts[1] = parts[1].substring(0, 2);
      value = parts.join(',');
    }

    this.serviceForm.patchValue({ price: value }, { emitEvent: false });
  }

  async saveService() {
    if (this.serviceForm.invalid) {
      this.markFormGroupTouched(this.serviceForm);
      return;
    }

    this.isSaving = true;
    const form = this.serviceForm.value;

    const duration = `${form.durationHours.toString().padStart(2, '0')}:${form.durationMinutes.toString().padStart(2, '0')}:00`;
    const priceNumber = this.parsePriceInput(form.price);

    const payload = {
      id: form.id,
      name: form.name,
      description: form.description,
      categoryId: form.category.id,
      price: priceNumber,
      duration: duration,
      activated: form.activated,
      variablePrice: form.variablePrice,
      variableTime: form.variableTime,
      storeId: this.store.id
    };

    try {
      if (this.editingService) {
        await this.updateService(payload, form.image);
      } else {
        await this.createService(payload, form.image);
      }
      await this.loadServices();
      this.closeForm();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      this.presentAlert('Erro ao salvar serviço', 'Por favor, tente novamente.');
    } finally {
      this.isSaving = false;
    }
  }

  parsePriceInput(value: string): number {
    if (!value) return 0;
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  buildFormData(serviceData: any, imageFile: File | null): FormData {
    const formData = new FormData();

    Object.entries(serviceData).forEach(([key, value]) => {
      if (value === null || value === undefined)
        return;
      if (key === 'price') {
        value = (
          typeof value === 'number'
            ? value
            : this.parsePriceInput(value as string)
        ).toFixed(2).replace('.', ',');
      }
      formData.append(key, value != null ? String(value) : '');
    });

    if (imageFile != null && typeof imageFile === 'string') {
      formData.append('imageUrl', imageFile);
    }
    else if (imageFile != null && imageFile instanceof File) {
      formData.append('imageFile', imageFile);
    }

    return formData;
  }

  async createService(serviceData: any, imageFile: File | null) {
    const formData = this.buildFormData(serviceData, imageFile);
    await this.serviceService.createService(formData).toPromise();
    this.presentAlert('Serviço criado com sucesso!');
  }

  async updateService(serviceData: any, imageFile: File | null) {
    const formData = this.buildFormData(serviceData, imageFile);
    await this.serviceService.updateService(serviceData.id, formData).toPromise();
    this.presentAlert('Serviço atualizado com sucesso!');
  }

  async confirmDelete(service: ServiceModel) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Deseja excluir o serviço "${service.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: () => this.deleteService(service.id) },
      ],
    });
    await alert.present();
  }

  async deleteService(serviceId: number) {
    try {
      await this.serviceService.deleteService(serviceId).toPromise();
      this.presentAlert('Serviço excluído com sucesso!');
      await this.loadServices();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      this.presentAlert('Erro ao excluir serviço', 'Por favor, tente novamente.');
    }
  }

  closeForm() {
    this.showForm = false;
    this.serviceForm.reset();
    this.previewUrl = null;
    this.editingService = null;
  }

  toggleActive(service: ServiceModel) {
    const updated = { ...service, activated: !service.activated };
    this.updateService(
      {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        categoryId: updated.category.id,
        price: updated.price,
        duration: updated.duration,
        activated: updated.activated,
        variablePrice: updated.variablePrice,
        variableTime: updated.variableTime,
        storeId: this.store.id,
        imageUrl: updated.imgPath
      },
      null
    );
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.serviceForm.patchValue({ image: file });

      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result;
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.serviceForm.patchValue({ image: null });
    this.previewUrl = null;
  }

  private unicodeToEmoji(text: string): string {
    return text?.replace(/\\u([\dA-F]{4})|\\u\{([\dA-F]{1,6})\}/gi,
      (match, g1, g2) => String.fromCodePoint(parseInt(g1 || g2, 16))
    ) || '';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private timeSpanToMinutes(time: string | number): number {
    if (typeof time === 'number') return time;
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + minutes;
  }

  async presentAlert(message: string, header: string = 'Sucesso') {
    const alert = await this.alertController.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }

  getBack() {
    this.navCtrl.back();
  }
}
