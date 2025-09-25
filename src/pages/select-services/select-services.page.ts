import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { AddCustomerToQueueRequest } from 'src/models/requests/add-customer-to-queue-request';
import { AddQueueServiceRequest } from 'src/models/requests/add-queue-service-request';
import { UpdateCustomerToQueueRequest } from 'src/models/requests/update-customer-to-queue-request';
import { ServiceModel } from 'src/models/service-model';
import { UserModel } from 'src/models/user-model';
import { CustomerService } from 'src/services/customer.service';
import { QueueService } from 'src/services/queue.service';
import { ServiceService } from 'src/services/services.service';
import { SessionService } from 'src/services/session.service';
import { SignalRService } from 'src/services/seignalr.service';

@Component({
  selector: 'app-select-services',
  templateUrl: './select-services.page.html',
  styleUrls: ['./select-services.page.scss'],
})
export class SelectServicesPage {

  queueId: number = 0;
  storeId: number = 0;
  totalTime = 0;
  totalPrice = 0;
  totalTimeString = '';
  totalPriceString = '';
  notes = '';
  paymentMethod = '1';
  selectedServices: ServiceModel[] = [];
  serviceOptions: ServiceModel[] = [];
  user: UserModel = {} as UserModel;
  customerId: number | null = null;
  looseCustomer: boolean = false;

  hasVariableTime: boolean = false;
  hasVariablePrice: boolean = false;
  fixedTimeTotal: number = 0;
  fixedPriceTotal: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private serviceService: ServiceService,
    private queueService: QueueService,
    private customerService: CustomerService,
    private sessionService: SessionService,
    private navCtrl: NavController,
    private signalRService: SignalRService
  ) {
    this.user = this.sessionService.getUser();
  }

  ngOnInit() {
    this.getProfessionalAndStore();
    this.loadAvailablesServices();
  }

  getProfessionalAndStore() {
    this.route.queryParams.subscribe(params => {
      this.queueId = params['queueId'];
      this.storeId = params['storeId'];
      this.customerId = params['customerId'] ? Number(params['customerId']) : null;
      this.looseCustomer = params['looseCustomer'] ? Boolean(params['looseCustomer']) : false;

      if (this.customerId) {
        this.loadSelectedServicesByCustomer(this.customerId);
      }
    });
  }

  getBack() {
    this.navCtrl.back();
  }

  // NOVO MÉTODO ADICIONADO PARA VERIFICAR SE SERVIÇO ESTÁ SELECIONADO
  isServiceSelected(service: ServiceModel): boolean {
    return this.selectedServices.some(selectedService => selectedService.id === service.id);
  }

  loadSelectedServicesByCustomer(customerId: number) {
    this.customerService.loadCustomerInfo(customerId).subscribe({
      next: (response) => {
        const services = response.data.services || [];

        this.paymentMethod = response.data.paymentMethodId || '1';
        this.notes = response.data.notes || '';

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
      this.serviceService.loadServiceById(this.storeId).subscribe({
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
    if (this.selectedServices[index].quantity > 1) {
      this.selectedServices[index].quantity--;
    } else {
      this.selectedServices.splice(index, 1);
    }

    this.updateTotals();
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
  }

  private convertTimeStringToMinutes(timeString: string): number {
    if (!timeString) return 0;

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
            this.proceedToQueue();
          }
        }
      ]
    });

    await alert.present();
  }

  addCustomerToQueue() {
    const servicesToSend: AddQueueServiceRequest[] = this.selectedServices.map(service => ({
      serviceId: service.id,
      quantity: service.quantity
    }));

    const command: AddCustomerToQueueRequest = {
      selectedServices: servicesToSend,
      notes: this.notes,
      paymentMethod: this.paymentMethod,
      queueId: this.queueId,
      userId: this.user.id,
      looseCustomer: this.looseCustomer
    };

    this.queueService.addCustomerToQueue(command).subscribe();
  }

  private async initSignalRConnection() {
    try {
      await this.signalRService.startQueueConnection();

      const store = this.sessionService.getStore();

      if (!store)
        throw new Error('Loja não encontrada');

      const groupName = store.id.toString();
      await this.signalRService.leaveQueueGroup(groupName);

      this.signalRService.onUpdateQueue((data) => {
        // Handler para atualizações da fila
      });

    } catch (error) {
      setTimeout(() => this.initSignalRConnection(), 5000);
    }
  }

  updateCustomerToQueue() {
    const servicesToSend: AddQueueServiceRequest[] = this.selectedServices.map(service => ({
      serviceId: service.id,
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

  proceedToQueue() {
    if (this.customerId) {
      this.updateCustomerToQueue();
      this.initSignalRConnection();

      this.navigateAfterQueue();
    } else {
      this.addCustomerToQueueAndNavigate(); 
    }
  }

  addCustomerToQueueAndNavigate() {
    const servicesToSend: AddQueueServiceRequest[] = this.selectedServices.map(service => ({
      serviceId: service.id,
      quantity: service.quantity
    }));

    const command: AddCustomerToQueueRequest = {
      selectedServices: servicesToSend,
      notes: this.notes,
      paymentMethod: this.paymentMethod,
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
}