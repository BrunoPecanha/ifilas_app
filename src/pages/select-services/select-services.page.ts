import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonContent } from '@ionic/angular';
import { AddCustomerToQueueRequest } from 'src/models/requests/add-customer-to-queue-request';
import { AddServiceRequest } from 'src/models/requests/add-service-request';
import { UpdateCustomerToQueueRequest } from 'src/models/requests/update-customer-to-queue-request';
import { ServiceModel } from 'src/models/service-model';
import { UserModel } from 'src/models/user-model';
import { CustomerService } from 'src/services/customer.service';
import { QueueService } from 'src/services/queue.service';
import { ServiceService } from 'src/services/services.service';
import { SessionService } from 'src/services/session.service';
import { SignalRService } from 'src/services/seignalr.service';
import { ScheduleService } from 'src/services/schedule.service';
import { AddCustomerToScheduleRequest } from 'src/models/requests/add-customer-to-schedule-request copy';
import { StoreModel } from 'src/models/store-model';

@Component({
  selector: 'app-select-services',
  templateUrl: './select-services.page.html',
  styleUrls: ['./select-services.page.scss'],
})
export class SelectServicesPage implements OnInit {

  @ViewChild(IonContent) content: IonContent = null as any;

  queueId: number = 0;
  scheduleId: number = 0;
  storeId: number = 0;
  totalTime = 0;
  totalPrice = 0;
  totalTimeString = '';
  totalPriceString = '';
  notes = '';
  paymentMethod = 1;
  selectedServices: ServiceModel[] = [];
  serviceOptions: ServiceModel[] = [];
  user: UserModel = {} as UserModel;
  customerId: number | null = null;
  looseCustomer: boolean = false;
  looseCustomerName: string = '';
  useAgenda: boolean = false;
  professionalId = 0;
  store!: StoreModel;
  professionalName = '';
  editingExistingAppointment: boolean = false;

  hasVariableTime: boolean = false;
  hasVariablePrice: boolean = false;
  fixedTimeTotal: number = 0;
  fixedPriceTotal: number = 0;

  preSelectedTimeSlot: any = null;
  preSelectedDate: Date | null = null;

  animatingAdd: { [id: number]: boolean } = {};
  headerScrolled = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private serviceService: ServiceService,
    private queueService: QueueService,
    private scheduleService: ScheduleService,
    private customerService: CustomerService,
    private sessionService: SessionService,
    private signalRService: SignalRService
  ) {
    this.user = this.sessionService.getUser();
    this.store = this.sessionService.getStore();
  }

  ngAfterViewInit() {
    this.content.scrollEvents = true;
    this.content.ionScroll.subscribe((event: any) => {
      this.headerScrolled = event.detail.scrollTop > 10;
    });
  }

  setupScrollListener() {
    const content = document.querySelector('ion-content');
    if (content) {
      content.addEventListener('ionScroll', (event: any) => {
        this.headerScrolled = event.detail.scrollTop > 10;
      });
    }
  }

  ngOnInit() {
    this.getProfessionalAndStore();
    this.setupScrollListener();
  }

  ionViewWillEnter() {
    const savedServices = this.sessionService.getGenericKey('selectedServices');

    if (savedServices) {
      this.selectedServices = savedServices;
      this.updateTotals();
      this.sessionService.removeGenericKey('selectedServices');
    }
  }

  trackByServiceId = (index: number, item: ServiceModel) => item?.id ?? index;

  getProfessionalAndStore() {
    const navState = this.router.getCurrentNavigation()?.extras?.state || (history && (history.state ?? {})) || {};
    const customerFromState = navState?.customer ?? null;

    this.route.queryParams.subscribe(params => {
      this.queueId = params['queueId'] ?? navState['queueId'] ?? null;
      this.scheduleId = params['scheduleId'] ?? navState['scheduleId'] ?? null;

      const storeIdParam = params['storeId'];
      const storeIdState = navState['storeId'];
      this.storeId = (storeIdParam !== undefined && storeIdParam !== null)
        ? Number(storeIdParam)
        : (storeIdState !== undefined && storeIdState !== null)
          ? Number(storeIdState)
          : (this.sessionService.getStore()?.id ?? 0);

      if (params['editingExistingAppointment'] !== undefined) {
        this.editingExistingAppointment = params['editingExistingAppointment'] === 'true';
      } else if (navState['editingExistingAppointment'] !== undefined) {
        this.editingExistingAppointment = navState['editingExistingAppointment'] === true || navState['editingExistingAppointment'] === 'true';
      } else {
        this.editingExistingAppointment = false;
      }

      this.professionalId = params['professionalId'] ?? navState['professionalId'] ?? null;
      this.professionalName = params['professionalName'] ?? navState['professionalName'] ?? null;

      if (params['useAgenda'] !== undefined) {
        this.useAgenda = params['useAgenda'] === 'true';
      } else if (customerFromState?.useAgenda !== undefined) {
        this.useAgenda = !!customerFromState.useAgenda;
      } else if (navState['useAgenda'] !== undefined) {
        this.useAgenda = navState['useAgenda'] === true || navState['useAgenda'] === 'true';
      } else {
        this.useAgenda = false;
      }

      if (params['looseCustomer'] !== undefined) {
        this.looseCustomer = params['looseCustomer'] === 'true';
      } else if (navState['looseCustomer'] !== undefined) {
        this.looseCustomer = navState['looseCustomer'] === true || navState['looseCustomer'] === 'true';
      } else {
        this.looseCustomer = false;
      }

      if (params['customerId'] !== undefined) {
        this.customerId = params['customerId'] ? Number(params['customerId']) : null;
      } else if (navState['customerId'] !== undefined) {
        this.customerId = navState['customerId'] ? Number(navState['customerId']) : null;
      } else if (customerFromState?.id && !customerFromState?.isWalkIn) {
        this.customerId = Number(customerFromState.id);
        this.looseCustomer = false;
      } else {
        this.customerId = null;
      }

      if (params['looseCustomerName'] !== undefined) {
        this.looseCustomerName = params['looseCustomerName'];
      } else if (navState['looseCustomerName'] !== undefined)
        this.looseCustomerName = navState['looseCustomerName'];

      if (customerFromState) {
        this.useAgenda = true
      }

      if (this.professionalId == null) {
        this.professionalId = this.user.id;
      }

      this.loadAvailablesServices();

      if (this.customerId) {
        this.loadSelectedServicesByCustomer(this.customerId);
      }

      var preSelectedDateAndTime = this.sessionService.getGenericKey('customerSelection');
      if (preSelectedDateAndTime) {
        this.preSelectedDate = preSelectedDateAndTime.selectedDate || null;
        this.preSelectedTimeSlot = preSelectedDateAndTime.preSelectedSlot || null;
      }
    });
  }

  get isPreScheduled(): boolean {
    return !!this.preSelectedDate && !!this.preSelectedTimeSlot;
  }

  getBack() {
    this.router.navigate(
      ['/select-professional'],
      {
        queryParams: { storeId: this.storeId }
      }
    );
  }

  isServiceSelected(service: ServiceModel): boolean {
    return this.selectedServices.some(selectedService => selectedService.id === service.id);
  }

  loadSelectedServicesByCustomer(customerId: number) {
    this.customerService.loadCustomerInfo(customerId).subscribe({
      next: (response) => {
        const services = response.data?.services || [];

        this.paymentMethod = response.data?.paymentMethodId || 1;
        this.notes = response.data?.notes || '';

        this.serviceService.loadServiceById(this.storeId).subscribe({
          next: (serviceResponse) => {
            this.serviceOptions = serviceResponse.data;

            this.selectedServices = services
              .map((s: any) => {
                const fullService = this.serviceOptions.find(opt => opt.name === s.name);

                if (!fullService) {
                  console.warn(`Serviço com nome "${s.name}" não encontrado nas opções disponíveis.`);
                  return null;
                }

                return {
                  ...fullService,
                  quantity: s.quantity
                } as ServiceModel;
              })
              .filter((s): s is ServiceModel => s !== null);

            this.updateTotals();
          },
          error: (err) => console.error('Erro ao carregar serviços disponíveis:', err)
        });
      },
      error: (err) => console.error('Erro ao carregar informações do cliente:', err)
    });
  }

  loadAvailablesServices() {
    if (this.storeId) {
      this.serviceService.loadServicesByStore(this.storeId, true).subscribe({
        next: (response) => {
          this.serviceOptions = response.data;
        },
        error: (err) => {
          console.error('Erro ao carregar serviços do estabelecimento:', err);
        }
      });
    } else {
      console.error('Não foi possível carregar os serviços/produtos da loja.');
    }
  }

  addService(service: ServiceModel) {
    const existingServiceIndex = this.selectedServices.findIndex(s => s.id === service.id);

    if (existingServiceIndex >= 0) {
      this.selectedServices[existingServiceIndex].quantity++;
    } else {
      this.selectedServices.push({
        ...service,
        quantity: 1
      });
    }

    this.updateTotals();
  }

  removeService(index: number) {
    if (!this.selectedServices[index]) return;
    if (this.selectedServices[index].quantity > 1) {
      this.selectedServices[index].quantity--;
    } else {
      this.selectedServices.splice(index, 1);
    }

    this.updateTotals();
  }

  removeServiceById(id: number) {
    const idx = this.selectedServices.findIndex(s => s.id === id);
    if (idx >= 0)
      this.removeService(idx);
  }

  addServiceWithAnimation(service: ServiceModel) {
    this.addService(service);

    if (service?.id != null) {
      this.animatingAdd[service.id] = true;
      setTimeout(() => {
        delete this.animatingAdd[service.id];
      }, 800);
    }
  }

  openServiceDetail(service: ServiceModel) {
    if (!service)
      return;

    this.router.navigate(['/item-details'], {
      state: {
        service: service,
        storeId: this.storeId,
        useAgenda: this.useAgenda,
        professionalName: this.professionalName,
        queueId: this.queueId,
        scheduleId: this.scheduleId,
        editingExistingAppointment: this.editingExistingAppointment
      }
    });
  }

  onSelectedClick(index: number) {
    this.removeService(index);
  }

  updateTotals() {
    this.hasVariableTime = this.selectedServices.some(
      service => service.variableTime
    );

    this.fixedTimeTotal = this.selectedServices.reduce((acc, service) => {
      if (service.variableTime)
        return acc;

      const durationInMinutes = typeof service.duration === 'string'
        ? this.convertTimeStringToMinutes(service.duration)
        : Number(service.duration) || 0;

      const quantity = Number(service.quantity) || 0;
      return acc + (durationInMinutes * quantity);
    }, 0);

    this.hasVariablePrice = this.selectedServices.some(
      service => service.variablePrice
    );

    this.fixedPriceTotal = this.selectedServices.reduce((acc, service) => {
      if (service.variablePrice)
        return acc;

      const price = Number(service.price) || 0;
      const quantity = Number(service.quantity) || 0;
      return acc + (price * quantity);
    }, 0);

    this.formatOutput();

    this.sessionService.setGenericKey(this.selectedServices, 'selectedServices');
  }

  private convertTimeStringToMinutes(timeString: string): number {
    if (!timeString)
      return 0;

    const [hoursStr, minutesStr, secondsStr] = timeString.split(':');
    const hours = parseInt(hoursStr, 10) || 0;
    const minutes = parseInt(minutesStr, 10) || 0;
    const seconds = parseInt(secondsStr, 10) || 0;

    return hours * 60 + minutes + Math.round(seconds / 60);
  }

  formatOutput() {
    const hours = Math.floor(this.fixedTimeTotal / 60);
    const minutes = Math.round(this.fixedTimeTotal % 60);

    let timeString = '';
    if (hours > 0) {
      timeString = `${hours}h ${minutes.toString().padStart(2, '0')}min`;
    } else {
      timeString = `${minutes}min`;
    }

    this.totalTimeString = this.hasVariableTime
      ? `${timeString} + a definir`
      : timeString;

    const formattedPrice = isNaN(this.fixedPriceTotal)
      ? '0,00'
      : this.fixedPriceTotal.toFixed(2).replace('.', ',');

    this.totalPriceString = this.hasVariablePrice
      ? `R$ ${formattedPrice} + a combinar`
      : `R$ ${formattedPrice}`;
  }

  async confirmSelection() {
    if (this.selectedServices.length === 0) {
      await this.presentAlert('Nenhum serviço selecionado', 'Por favor, selecione pelo menos um serviço.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Serviços',
      message: `Você selecionou ${this.selectedServices.length} serviço(s) com valor total de ${this.totalPriceString}. Deseja continuar?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => {
            if (this.useAgenda) {
              this.proceedToSchedule();
            } else
              this.goToQueueCheckout();
          }
        }
      ]
    });

    await alert.present();
  }

  addCustomer() {
    const servicesToSend: AddServiceRequest[] = this.selectedServices.map(service => ({
      id: service.id,
      quantity: service.quantity
    }));

    if (this.scheduleId && this.scheduleId > 0) {
      const command: AddCustomerToQueueRequest = {
        selectedServices: servicesToSend,
        notes: this.notes,
        paymentMethod: this.paymentMethod,
        queueId: this.queueId,
        professionalId: this.professionalId,
        userId: this.user.id,
        looseCustomer: this.looseCustomer
      };
      this.addToQueue(command);
    } else {
      const command: AddCustomerToScheduleRequest = {
        selectedServices: servicesToSend,
        notes: this.notes,
        paymentMethod: this.paymentMethod,
        scheduleId: this.scheduleId,
        customerId: this.user.id,
        looseCustomer: this.looseCustomer,
        looseCustomerName: this.looseCustomerName,
        storeId: this.storeId,
        professionalId: this.professionalId,
        time: '',
        date: new Date(),
        editingExistingAppointment: true
      };
      this.addToSchedule(command);
    }
  }

  private addToQueue(command: AddCustomerToQueueRequest) {
    this.queueService.addCustomerToQueue(command).subscribe({
      next: async (response) => {
        console.log('Cliente adicionado à fila:', response);
      },
      error: async (err) => {
        console.error('Erro ao adicionar à fila:', err);
      }
    });
  }

  private addToSchedule(command: AddCustomerToScheduleRequest) {
    this.scheduleService.addCustomerToSchedule(command).subscribe({
      next: async (response) => {
        console.log('Cliente adicionado ao agendamento:', response);
      },
      error: async (err) => {
        console.error('Erro ao adicionar ao agendamento:', err);
      }
    });
  }

  private async initSignalRConnection() {
    try {
      await this.signalRService.startQueueConnection();
      await this.signalRService.startScheduleConnection();

      const store = this.sessionService.getStore();

      if (!store)
        throw new Error('Loja não encontrada');

      const groupName = store.id.toString();
      await this.signalRService.leaveQueueGroup(groupName);

      this.signalRService.onUpdateQueue((data) => {
      });

      this.signalRService.onUpdateSchedule((data) => {
      });
    } catch (error) {
      setTimeout(() => this.initSignalRConnection(), 5000);
    }
  }

  updateCustomerToQueue() {
    const servicesToSend: AddServiceRequest[] = this.selectedServices.map(service => ({
      id: service.id,
      quantity: service.quantity
    }));

    const command: UpdateCustomerToQueueRequest = {
      selectedServices: servicesToSend,
      notes: this.notes,
      paymentMethod: Number(this.paymentMethod),
      id: this.customerId || 0
    };

    this.queueService.updateCustomerToQueue(command).subscribe();
  }

  goToQueueCheckout() {
    const storeData = {
      name: this.store.name,
      logo: this.store.logoPath
    };

    const checkoutContext = {
      flow: this.useAgenda ? 'agenda' : 'queue',
      storeId: this.storeId,
      storeData: storeData,
      queueId: this.queueId,
      professionalId: this.professionalId,
      professionalName: this.professionalName,
      customerId: this.customerId,
      looseCustomer: this.looseCustomer,
      looseCustomerName: this.looseCustomerName,
      notes: this.notes,
      paymentMethod: this.paymentMethod,
      selectedServices: this.selectedServices,
      totalTime: this.fixedTimeTotal,
      totalPrice: this.fixedPriceTotal,
      totalTimeString: this.totalTimeString,
      totalPriceString: this.totalPriceString,
      editingExistingAppointment: this.editingExistingAppointment,
      userId: this.user.id
    };

    this.sessionService.setGenericKey(
      JSON.parse(JSON.stringify(checkoutContext)),
      'queueCheckoutContext'
    );

    this.router.navigate(['/checkout'], {
      state: checkoutContext
    });
  }

  proceedToQueue() {
    if (this.customerId) {
      this.updateCustomerToQueue();
      this.initSignalRConnection();

      this.navigateAfterQueue();
    } else {
      this.addCustomerToQueueAndNavigate();
    }
  }

  proceedToSchedule() {
    this.sessionService.setGenericKey(this.selectedServices, 'selectedServices');
    this.sessionService.setGenericKey(this.notes, 'notes');
    this.sessionService.setGenericKey(this.paymentMethod, 'paymentMethod');
    this.sessionService.setGenericKey(this.storeId, 'storeId');
    this.sessionService.setGenericKey(this.professionalId, 'professionalId');
    this.sessionService.setGenericKey(this.looseCustomer, 'looseCustomer');
    this.sessionService.setGenericKey(this.looseCustomerName, 'looseCustomerName');

    if (this.isPreScheduled) {
      this.addCustomerToScheduleAndNavigate();
    } else {
      this.router.navigate(['/schedule-appointment']);
    }
  }

  addCustomerToScheduleAndNavigate() {
    const servicesToSend: AddServiceRequest[] = this.selectedServices.map(s => ({
      id: s.id,
      quantity: s.quantity
    }));

    const command: AddCustomerToScheduleRequest = {
      scheduleId: this.scheduleId,
      selectedServices: servicesToSend,
      notes: this.notes,
      paymentMethod: this.paymentMethod,
      professionalId: this.professionalId,
      storeId: this.storeId,
      customerId: this.looseCustomerName ? 0 : this.customerId,
      looseCustomer: this.looseCustomerName ? true : false,
      looseCustomerName: this.looseCustomerName,
      time: this.preSelectedTimeSlot.time,
      date: this.preSelectedDate!
    };

    this.scheduleService.addCustomerToSchedule(command).subscribe({
      next: () => {
        this.sessionService.removeGenericKey('customerSelection');
        this.router.navigate(['/owner-schedule']);
      },
      error: err => console.error(err)
    });
  }

  addCustomerToQueueAndNavigate() {
    const servicesToSend: AddServiceRequest[] = this.selectedServices.map(service => ({
      id: service.id,
      quantity: service.quantity
    }));

    const command: AddCustomerToQueueRequest = {
      selectedServices: servicesToSend,
      notes: this.notes,
      paymentMethod: this.paymentMethod,
      professionalId: this.professionalId,
      queueId: this.queueId,
      userId: this.user.id,
      looseCustomer: this.looseCustomer
    };

    this.queueService.addCustomerToQueue(command).subscribe({
      next: () => {
        this.navigateAfterQueue();
      },
      error: (err) => {
        console.error('Erro ao adicionar cliente na fila:', err);
      }
    });
  }

  private navigateAfterQueue() {
    const queryParams = {
      userId: this.user.id,
      editingExistingAppointment: this.editingExistingAppointment
    };

    if (this.looseCustomer) {
      this.router.navigate(['/customer-list-in-queue'], { queryParams });
    } else {
      this.router.navigate(['/queue'], { queryParams });
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

  getQuantity(service: ServiceModel): number {
    const s = this.selectedServices.find(x => x.id === service.id);
    return s ? (Number(s.quantity) || 0) : 0;
  }

  onAddBtnClick(service: ServiceModel, event: Event) {
    event.stopPropagation();

    const qty = this.getQuantity(service);
    if (qty === 0) {
      this.addServiceWithAnimation(service);
    } else {
      this.incrementServiceForUi(service, event);
    }
  }

  incrementServiceForUi(service: ServiceModel, event?: Event) {
    if (event)
      event.stopPropagation();

    const idx = this.selectedServices.findIndex(s => s.id === service.id);

    if (idx >= 0) {
      const updated = {
        ...this.selectedServices[idx],
        quantity: (Number(this.selectedServices[idx].quantity) || 0) + 1
      };

      this.selectedServices[idx] = updated;
      this.selectedServices = [...this.selectedServices];
    } else {
      this.selectedServices = [
        ...this.selectedServices,
        { ...service, quantity: 1 }
      ];

      if (service?.id != null) {
        this.animatingAdd[service.id] = true;
        setTimeout(() => delete this.animatingAdd[service.id], 700);
      }
    }

    this.updateTotals();
  }

  decrementServiceForUi(service: ServiceModel, event?: Event) {
    if (event)
      event.stopPropagation();

    const idx = this.selectedServices.findIndex(s => s.id === service.id);
    if (idx < 0) return;

    const current = Number(this.selectedServices[idx].quantity) || 0;

    if (current > 1) {
      this.selectedServices[idx] = {
        ...this.selectedServices[idx],
        quantity: current - 1
      };
    } else {
      this.selectedServices.splice(idx, 1);
    }

    this.selectedServices = [...this.selectedServices];

    this.updateTotals();
  }
}