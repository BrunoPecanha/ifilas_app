import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonContent, ModalController, NavController } from '@ionic/angular';
import { CustomerInQueueForEmployeeModel } from 'src/models/customer-in-queue-for-employee-model';
import { StatusQueueEnum } from 'src/models/enums/status-queue.enum';
import { QueueModel } from 'src/models/queue-model';
import { QueuePauseRequest } from 'src/models/requests/queue-pause-request';
import { StoreModel } from 'src/models/store-model';
import { UserModel } from 'src/models/user-model';
import { CustomerService } from 'src/services/customer.service';
import { QrScannerService } from 'src/services/qr-scanner.service';
import { QueueService } from 'src/services/queue.service';
import { SignalRService } from 'src/services/seignalr.service';
import { SessionService } from 'src/services/session.service';
import { ToastService } from 'src/services/toast.service';
import { ServiceConfigModalComponent } from 'src/shared/components/service-config-modal-component/service-config-modal.component';
import { isToday } from 'src/utils/date-utils';

@Component({
  selector: 'app-customer-list-in-queue',
  templateUrl: './customer-list-in-queue.page.html',
  styleUrls: ['./customer-list-in-queue.page.scss'],
})
export class CustomerListInQueuePage implements OnInit, OnDestroy {
  @ViewChild(IonContent) content: IonContent = null as any;

  clients: CustomerInQueueForEmployeeModel[] = [];
  currentDate = new Date();
  isLoading: boolean = false;
  isPaused: boolean = false;
  queue: QueueModel | null = null;
  store: StoreModel = {} as StoreModel;
  employee!: UserModel;
  showScrollIndicator: boolean = true;
  headerScrolled = false;

  editingNameMap: { [clientId: number]: boolean } = {};
  editedNames: { [clientId: number]: string } = {};

  isServiceConfigModalOpen = false;
  servicePrice: number | null = null;
  serviceTime: number | null = null;
  currentClient: any = null;
  lastScrollTop = 0;
  hideHeader = false;
  private storeId: number;
  private signalRGroup: string;

  constructor(
    private navCtrl: NavController,
    private customerService: CustomerService,
    private queueService: QueueService,
    private sessionService: SessionService,
    private alertController: AlertController,
    private toast: ToastService,
    private modalCtrl: ModalController,
    private signalRService: SignalRService,
    private router: Router,
    private qrScanner: QrScannerService,
    private toastService: ToastService
  ) {
    this.store = this.sessionService.getStore();
    this.storeId = this.store.id;
    this.employee = this.sessionService.getUser();
    this.signalRGroup = this.storeId.toString();
  }

  ngOnInit() {
    this.initSignalRConnection();
    this.loadInitialData();
  }

  ionViewDidEnter() {
    this.loadInitialData();
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

  ngOnDestroy() {
    this.cleanupSignalR();
  }

  getClientsInServiceCount(): number {
    return this.clients.filter(client => client.inService).length;
  }

  calculateWaitingTime(arrivalTime: string): string {
    const agora = new Date();
    const [h, m] = arrivalTime.split(':').map(Number);
    const entrada = new Date();
    entrada.setHours(h, m, 0, 0);

    const diffMs = agora.getTime() - entrada.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    return this.formatMinutesToHHMM(diffMin);
  }


  async openServiceConfig(client: any) {
    const servicesMapped = client.services
      .filter((s: any) => s.variablePrice || s.variableTime)
      .map((s: any) => ({
        id: s.serviceId,
        name: s.name,
        finalPrice: s.finalPrice,
        finalDuration: s.finalDuration,
        variablePrice: s.variablePrice,
        variableTime: s.variableTime,
        quantity: s.quantity || 1
      }));

    const modal = await this.modalCtrl.create({
      component: ServiceConfigModalComponent,
      componentProps: {
        customerId: client.id,
        services: servicesMapped
      }
    });

    modal.present();

    const { data } = await modal.onDidDismiss();

    if (data) {
      this.saveClientServices(data);
    }
  }

  saveClientServices(customerServicesUpdate: any) {
    this.customerService.updatePriceAndTimeForVariableServiceAsync(customerServicesUpdate)
      .subscribe();
  }

  canEditCustomerPriceAndTime(client: any): boolean {
    return Array.isArray(client.services) &&
      client.services.some((s: { variablePrice: any; variableTime: any; }) => s.variablePrice || s.variableTime);
  }

  private async initSignalRConnection() {
    try {
      await this.signalRService.startQueueConnection();
      await this.signalRService.startScheduleConnection();

      const store = this.sessionService.getStore();

      if (!store)
        throw new Error('Loja não encontrada');

      const groupName = store.id.toString();
      this.signalRGroup = groupName;

      await this.signalRService.joinQueueGroup(groupName);

      this.signalRService.offUpdateQueue();
      this.signalRService.onUpdateQueue((data) => {
        this.loadQueueData();
      });

    } catch (error) {
      console.error('Erro SignalR (loja):', error);
      setTimeout(() => this.initSignalRConnection(), 5000);
    }
  }

  private cleanupSignalR() {
    this.signalRService.offUpdateQueue();
    if (this.signalRGroup) {
      this.signalRService.leaveQueueGroup(this.signalRGroup);
    }
  }

  private loadInitialData() {
    this.loadQueueData();
    this.getQueueOrAgendaForEmployee();
  }

  enableEditName(client: CustomerInQueueForEmployeeModel) {
    this.editingNameMap[client.id] = true;
    this.editedNames[client.id] = client.name;
  }

  cancelEditName(clientId: number) {
    this.editingNameMap[clientId] = false;
  }

  addCustomerToQueue() {
    this.router.navigate(['/select-services'], {
      queryParams: { looseCustomer: true, queueId: this.queue?.id, storeId: this.store.id }
    });
  }

  saveEditedName(client: CustomerInQueueForEmployeeModel) {
    const newName = this.editedNames[client.id]?.trim();
    if (!newName || newName === client.name) {
      this.cancelEditName(client.id);
      return;
    }

    this.queueService.updateCustomerName(client.id, newName).subscribe({
      next: () => {
        client.name = newName;
        this.toast.show('Nome atualizado com sucesso', 'success');
        this.cancelEditName(client.id);
      },
      error: (err) => {
        console.error('Erro ao atualizar nome:', err);
        this.toast.show('Erro ao atualizar nome', 'danger');
      }
    });
  }

  private loadQueueData() {
    this.store = this.sessionService.getStore();

    if (!this.storeId || !this.employee.id)
      return;

    this.isLoading = true;
    this.queueService.getAllCustomersInQueueByEmployeeAndStoreId(this.storeId, this.employee.id)
      .subscribe({
        next: (response) => {
          this.clients = response.data || [];
          if (this.clients.length > 0) {
            this.isPaused = this.clients[0].isPaused;
          }
        },
        error: (err) => {
          console.error('Erro ao carregar clientes:', err);
          this.toast.show('Erro ao carregar lista de clientes', 'danger');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  async confirmStartService(customer: CustomerInQueueForEmployeeModel) {
    if (customer.inService) {
      this.navCtrl.navigateForward(`/customer-service/${customer.id}`);
      return;
    }

    const employeeId = this.sessionService.getUser()?.id;
    const exigeQrCode = await this.checkQrCodeRiquired();

    if (!exigeQrCode) {
      this.startService(customer.id, employeeId);
      return;
    }

    const buttons: any[] = [
      {
        text: 'Ler QR Code',
        handler: async () => {
          const result = await this.qrScanner.scanQrCode();

          if (!result) {
            this.toastService.show('Leitura cancelada ou QR Code inválido', 'warning');
            return;
          }

          const scannedId = Number(result);

          if (scannedId === customer.id) {
            this.startService(customer.id, this.employee.id);
          } else {
            this.toastService.show('QR Code não confere com este cliente', 'danger');
          }
        },
      }
    ];

    if (this.store.inCaseFailureAcceptFinishWithoutQRCode && this.store.startServiceWithQRCode) {
      buttons.push({
        text: 'Iniciar sem QR Code',
        handler: async () => {
          this.startService(customer.id, employeeId);
        },
      });
    }

    buttons.push({
      text: 'Cancelar',
      role: 'cancel',
    });

    const alert = await this.alertController.create({
      header: 'Confirmação',
      message: 'Deseja iniciar o atendimento deste cliente?',
      buttons,
    });

    await alert.present();
  }

  private startService(customerId: number, employeeId: number) {
    this.queueService.startCustomerService(customerId, employeeId).subscribe({
      next: () => {
        this.navCtrl.navigateForward(`/customer-service/${customerId}`);
      },
      error: (err) => {
        console.error('Erro ao iniciar atendimento:', err);
        this.toastService.show('Erro ao iniciar atendimento', 'danger');
      }
    });
  }

  private async checkQrCodeRiquired(): Promise<boolean> {
    return !!this.store && !!this.store.startServiceWithQRCode;
  }

  async handleRefresh(event: any) {
    try {
      await this.loadAllCustomersInQueueByEmployeeAndStoreId();
    } finally {
      event.target.complete();
    }
  }

  pauseQueue() {
    const request: QueuePauseRequest = {
      id: this.queue?.id,
      pauseReason: 'Pausa pela loja'
    };

    this.queueService.pauseQueue(request).subscribe({
      next: (response) => {
        if (response.data.status === StatusQueueEnum.paused) {
          this.toast.show(`Fila pausada com sucesso.`, 'warning');
          this.isPaused = true;
        }
        else {
          this.toast.show(`Fila despausada com sucesso.`, 'success');
          this.isPaused = false;
        }
      },
      error: (err) => {
        console.error('Erro ao pausar fila:', err);
        this.toast.show(`Erro ao pausar a fila.`, 'danger');
      }
    });
  }

  get isAnyClientInService(): boolean {
    return this.clients?.some(client => client.inService) && !this.store.attendSimultaneously;
  }

  private getQueueOrAgendaForEmployee() {
    if (!this.employee.id)
      return;

    this.queueService.getOpenedQueueListByEmployeeId(this.employee.id, this.store.id, this.store.shareQueue)
      .subscribe({
        next: (response) => {
          if (response.valid && response.data?.length > 0) {
            const openQueue = response.data.find(q =>
              (q.status === StatusQueueEnum.open || q.status === StatusQueueEnum.paused) &&
              isToday(q.date)
            );

            if (openQueue) {
              this.queue = openQueue;
              this.isPaused = openQueue.status === StatusQueueEnum.paused;
            } else {
              this.toast.show('Não há fila aberta para hoje.', 'warning');
              this.navigateToQueueAdmin();
            }

          } else {
            this.navigateToQueueAdmin();
          }
        },
        error: (err) => {
          this.navCtrl.navigateRoot('/splash');
          this.toast.show('Erro ao carregar informações da fila', 'danger');
        }
      });
  }

  private navigateToQueueAdmin() {
    this.navCtrl.navigateForward('/queue-admin');
  }

  async openRemoveConfirmation(client: CustomerInQueueForEmployeeModel) {
    const alert = await this.alertController.create({
      header: 'Confirmação',
      message: `Tem certeza que deseja remover: \n${client.name}?`,
      inputs: [{
        name: 'reason',
        type: 'text',
        placeholder: 'Motivo da remoção (opcional)'
      }],
      buttons: [
        { text: 'Não', role: 'cancel' },
        {
          text: 'Sim',
          handler: async (data) => {
            await this.removeCustomer(client.id, data.reason);
          }
        }
      ]
    });

    await alert.present();
  }

  loadAllCustomersInQueueByEmployeeAndStoreId() {
    this.isLoading = true;
    this.store = this.sessionService.getStore();

    if (this.store && this.employee) {
      this.queueService.getAllCustomersInQueueByEmployeeAndStoreId(this.store.id, this.employee.id).subscribe({
        next: (response) => {
          this.clients = response.data;

          if (this.clients[0]) {
            this.isPaused = this.clients[0].isPaused;
          }

        },
        complete: () => {
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao carregar estabelecimentos:', err);
        }
      });
    } else {
      console.error('Loja ou funcionário não localizado.');
    }
  }

  getServiceDescriptions(customer: CustomerInQueueForEmployeeModel): string {
    return customer.services
      ?.map(s => s.quantity > 1 ? `${s.name} (${s.quantity}x)` : s.name)
      .join(', ') || '';
  }

  private async removeCustomer(customerId: number, reason?: string) {
    try {
      await this.queueService.removeMissingCustomer(customerId, reason || 'Removido pelo funcionário')
        .toPromise();

      this.loadQueueData();
      await this.toast.show('Cliente removido com sucesso', 'success');
    } catch (error) {
      await this.toast.show('Erro ao remover cliente', 'danger');
    }
  }

  startCustomerService(customer: CustomerInQueueForEmployeeModel) {
    if (customer.inService) {
      this.navCtrl.navigateForward(`/customer-service/${customer.id}`);
      return;
    }

    this.queueService.startCustomerService(customer.id, this.employee?.id || 0).subscribe({
      next: () => {
        this.navCtrl.navigateForward(`/customer-service/${customer.id}`);
      },
      error: (err) => {
        console.error('Erro ao iniciar atendimento:', err);
        this.toast.show('Erro ao iniciar atendimento', 'danger');
      }
    });
  }

  toggleQueuePause() {
    if (!this.queue)
      return;

    const request: QueuePauseRequest = {
      id: this.queue.id,
      pauseReason: 'Pausa pela loja'
    };

    this.queueService.pauseQueue(request).subscribe({
      next: (response) => {
        this.isPaused = response.data.status === StatusQueueEnum.paused;
        const message = this.isPaused
          ? 'Fila pausada com sucesso'
          : 'Fila despausada com sucesso';
        this.toast.show(message, this.isPaused ? 'warning' : 'success');
      },
      error: (err) => {
        console.error('Erro ao pausar fila:', err);
        this.toast.show('Erro ao alterar estado da fila', 'danger');
      }
    });
  }

  callCustomer(customer: CustomerInQueueForEmployeeModel) {
    this.queueService.notifyTimeCustomerWasCalledInTheQueue(customer.id)
      .subscribe({
        next: (response) => {
          customer.timeCalledInQueue = response.data;
          this.toast.show('Cliente notificado com sucesso', 'success');
        },
        error: (err) => {
          console.error('Erro ao notificar cliente:', err);
          this.toast.show('Erro ao notificar cliente', 'danger');
        }
      });
  }

  onContentScroll(event: CustomEvent) {
    const scrollTop = event.detail?.scrollTop ?? 0;
    const delta = scrollTop - this.lastScrollTop;

    if (delta > 5 && scrollTop > 60) {
      this.hideHeader = true;
    } else if (delta < -5) {
      this.hideHeader = false;
    }

    this.lastScrollTop = scrollTop;
  }

  getWaitingClientsCount(): number {
    return this.clients?.filter(client => !client.inService).length || 0;
  }

  isToday(): boolean {
    const today = new Date();
    return this.currentDate.toDateString() === today.toDateString();
  }

  getWeekdayName(date: Date): string {
    const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return weekdays[date.getDay()];
  }

  // Filtros (para implementação futura)
  hasActiveFilters(): boolean {
    return false; // Implementar conforme necessidade
  }

  getActiveFilters(): any[] {
    return []; // Implementar conforme necessidade
  }

  goToToday() {
    this.currentDate = new Date();
    // this.applyFilters(); // Implementar conforme necessidade
  }

  removeFilter(key: string): void {
    // Implementar conforme necessidade
  }

  clearFilters(): void {
    // Implementar conforme necessidade
  }

  calculateWaitTime(entryTime: string): string {
    const now = new Date();
    const [hours, minutes] = entryTime.split(':').map(Number);
    const entryDate = new Date();
    entryDate.setHours(hours, minutes, 0, 0);

    const diffMs = now.getTime() - entryDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    return `Esperando há ${this.formatMinutesToHHMM(diffMinutes)} min`;
  }

  formatMinutesToHHMM(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  openWhatsapp(customer: CustomerInQueueForEmployeeModel) {
    const phone = customer.id;
    if (!phone) {
      this.toast.show('Número de telefone não disponível', 'warning');
      return;
    }

    const message = encodeURIComponent(`Olá ${customer.name}, sua vez na fila chegou!`);
    const url = `https://wa.me/55${phone}?text=${message}`;
    window.open(url, '_blank');
  }

  getPaymentColor(paymentIcon: string): string {
    const colorMap: { [key: string]: string } = {
      'cash-outline': 'success',
      'card-outline': 'primary',
      'wallet-outline': 'warning',
      'qr-code-outline': 'secondary'
    };

    return colorMap[paymentIcon] || 'medium';
  }
}