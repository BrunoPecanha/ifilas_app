import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
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

@Component({
  selector: 'app-select-services',
  templateUrl: './select-services.page.html',
  styleUrls: ['./select-services.page.scss'],
})
export class SelectServicesPage implements OnInit {

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
  useAgenda: boolean = false;
  professionalId = 0;
  professionalName = '';
  editingExistingAppointment: boolean = false;

  hasVariableTime: boolean = false;
  hasVariablePrice: boolean = false;
  fixedTimeTotal: number = 0;
  fixedPriceTotal: number = 0;

  // controle de animação do botão de adicionar por id do serviço
  animatingAdd: { [id: number]: boolean } = {};

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
  }

  ngOnInit() {
    this.getProfessionalAndStore();
  }

  // trackBy para performance em ngFor
  trackByServiceId = (index: number, item: ServiceModel) => item?.id ?? index;

  getProfessionalAndStore() {
    this.route.queryParams.subscribe(params => {
      this.queueId = params['queueId'];
      this.scheduleId = params['scheduleId'];
      this.storeId = params['storeId'];
      this.editingExistingAppointment = params['editingExistingAppointment'] === 'true';
      this.professionalId = params['professionalId'];
      this.professionalName = params['professionalName'];
      this.useAgenda = params['useAgenda'] === 'true';
      this.customerId = params['customerId'] ? Number(params['customerId']) : null;
      this.looseCustomer = params['looseCustomer'] === 'true';

      this.storeId = Number(this.storeId) || this.sessionService.getStore()?.id || 0;

      this.loadAvailablesServices();

      if (this.customerId) {
        this.loadSelectedServicesByCustomer(this.customerId);
      }
    });
  }

  getBack() {
    this.router.navigate(['/select-professional']), {
      queryParams: { storeId: this.storeId }
    };
  }

  isServiceSelected(service: ServiceModel): boolean {
    return this.selectedServices.some(selectedService => selectedService.id === service.id);
  }

  loadSelectedServicesByCustomer(customerId: number) {
    this.customerService.loadCustomerInfo(customerId).subscribe({
      next: (response) => {
        const services = response.data.services || [];

        this.paymentMethod = response.data.paymentMethodId || 1;
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

  /**
   * Adiciona serviço (método original)
   * Mantive seu comportamento original: incrementa quantity se já existir, senão adiciona.
   */
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

  /**
   * Remover por index (método original)
   */
  removeService(index: number) {
    if (!this.selectedServices[index]) return;
    if (this.selectedServices[index].quantity > 1) {
      this.selectedServices[index].quantity--;
    } else {
      this.selectedServices.splice(index, 1);
    }

    this.updateTotals();
  }

  /**
   * Remove por id (usado quando usuario clica no botão de adicionar novamente)
   */
  removeServiceById(id: number) {
    const idx = this.selectedServices.findIndex(s => s.id === id);
    if (idx >= 0) this.removeService(idx);
  } 


  addServiceWithAnimation(service: ServiceModel) {
    // adiciona de fato
    this.addService(service);

    // seta animando
    if (service?.id != null) {
      this.animatingAdd[service.id] = true;
      // limpa após 700-900ms para mostrar check
      setTimeout(() => {
        delete this.animatingAdd[service.id];
      }, 800);
    }
  }

  /**
   * Abre detalhe do serviço (parâmetro: ServiceModel).
   * ATENÇÃO: se não tiver rota de detalhe, por enquanto apenas loga.
   * Você pode adaptar para navegar para a página de detalhe se existir.
   */
  openServiceDetail(service: ServiceModel) {
    if (!service) return;
    // Se você tiver uma rota de detalhe, descomente e ajuste a linha abaixo:
    // this.router.navigate(['/service-detail'], { queryParams: { serviceId: service.id, storeId: this.storeId } });

    // Por enquanto, só log pra não quebrar o template e para fácil debugging:
    console.log('openServiceDetail:', service);
  }

  /**
   * Clique em item selecionado da lista (comportamento atual: remove o item).
   * Se preferir abrir detalhe, substitua por navegação.
   */
  onSelectedClick(index: number) {
    // comportamento padrão: remover item
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
              this.proceedToQueue();
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

      const store = this.sessionService.getStore();

      if (!store)
        throw new Error('Loja não encontrada');

      const groupName = store.id.toString();
      await this.signalRService.leaveQueueGroup(groupName);

      this.signalRService.onUpdateQueue((data) => {
        // tratar update se necessário
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
    this.sessionService.setGenericKey('notes', this.notes);
    this.sessionService.setGenericKey(this.paymentMethod, 'paymentMethod');
    this.sessionService.setGenericKey(this.storeId, 'storeId');
    this.sessionService.setGenericKey(this.professionalId, 'professionalId');

    this.router.navigate(['/schedule-appointment']);
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

  // retorna quantidade selecionada para o serviço (0 se não existir)
  getQuantity(service: ServiceModel): number {
    const s = this.selectedServices.find(x => x.id === service.id);
    return s ? (Number(s.quantity) || 0) : 0;
  }

  /**
   * Chamada a partir do botão + inicial.
   * Se qty === 0 mostra animação de adição, se já tem, só incrementa.
   */
  onAddBtnClick(service: ServiceModel, event: Event) {
    event.stopPropagation();

    const qty = this.getQuantity(service);
    if (qty === 0) {
      // primeira adição -> animação + cria item com quantity 1
      this.addServiceWithAnimation(service);
    } else {
      // se já existe, incrementa normalmente
      this.incrementServiceForUi(service, event);
    }
  }

  /**
   * Incremente via UI (+ no contador)
   */
  incrementServiceForUi(service: ServiceModel, event?: Event) {
    if (event) event.stopPropagation();

    const idx = this.selectedServices.findIndex(s => s.id === service.id);
    if (idx >= 0) {
      // já existe: apenas incrementa
      this.selectedServices[idx].quantity = (Number(this.selectedServices[idx].quantity) || 0) + 1;
      this.updateTotals();
    } else {
      // não existe: adiciona com quantity 1 (sem duplicar referências)
      this.selectedServices.push({ ...service, quantity: 1 } as ServiceModel);
      // animação pra feedback
      if (service?.id != null) {
        this.animatingAdd[service.id] = true;
        setTimeout(() => delete this.animatingAdd[service.id], 700);
      }
      this.updateTotals();
    }
  }

  /**
   * Decrementa via UI (- no contador). Se chegar em 0 remove o serviço.
   */
  decrementServiceForUi(service: ServiceModel, event?: Event) {
    if (event) event.stopPropagation();

    const idx = this.selectedServices.findIndex(s => s.id === service.id);
    if (idx < 0) return;

    const current = Number(this.selectedServices[idx].quantity) || 0;
    if (current > 1) {
      this.selectedServices[idx].quantity = current - 1;
    } else {
      // remove completamente quando chega a zero
      this.selectedServices.splice(idx, 1);
    }
    this.updateTotals();
  }
}
