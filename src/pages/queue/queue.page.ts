import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { CustomerInQueueCardDetailModel } from 'src/models/customer-in-queue-card-detail-model';
import { CustomerInQueueCardModel } from 'src/models/customer-in-queue-card-model';
import { StoreModel } from 'src/models/store-model';
import { QueueService } from 'src/services/queue.service';
import { SignalRService } from 'src/services/seignalr.service';
import { SessionService } from 'src/services/session.service';
import { StoresService } from 'src/services/stores.service';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.page.html',
  styleUrls: ['./queue.page.scss'],
})
export class QueuePage {
  customerCards: CustomerInQueueCardModel[] | [] = [];
  fallbackRoute = '/select-company';
  stores: StoreModel[] = [];
  currentDate = new Date();
  qrCodeBase64: string | null = null;
  tolerance = 5;
  currentlyExpandedCardId: number | null = null;  
  activeFilter: string = 'all';

  private cardDetailsMap = new Map<number, CustomerInQueueCardDetailModel>();

  constructor(
    private alertController: AlertController,
    public router: Router,
    private queueService: QueueService,
    private storeService: StoresService,
    private sessionService: SessionService,
    private toastController: ToastController,
    private signalRService: SignalRService
  ) {
  }

  ionViewDidEnter() {
    this.forceReload();
    this.startSignalRConnection();
  }

  async startSignalRConnection() {
    try {

      await this.signalRService.startQueueConnection();
      const user = this.sessionService.getUser();

      if (!user?.id)
        throw new Error('Usuário inválido');

      const response = await this.storeService.loadAllStoresUserIsInByUserId(user.id).toPromise();
      const stores = response?.data || [];

      const groupNames = stores
        .filter(store => !!store?.id)
        .map(store => store.id.toString());

      if (groupNames.length > 0) {
        await Promise.all(
          groupNames.map(group => this.signalRService.joinQueueGroup(group))
        );
      }

      this.signalRService.onUpdateQueue((data) => {
        this.refreshQueues();
      });

    } catch (error) {
      console.error('Erro SignalR (cliente):', error);
      setTimeout(() => this.startSignalRConnection(), 5000);
    }
  }

  private forceReload(): void {
    const previouslyExpanded = this.currentlyExpandedCardId;

    this.customerCards = [];
    this.currentlyExpandedCardId = null;
    this.cardDetailsMap.clear();
    this.qrCodeBase64 = null;

    this.loadCustomersInQueueCard();

    setTimeout(() => {
      if (previouslyExpanded !== null) {
        const card = this.customerCards.find(c => c.queueId === previouslyExpanded);
        if (card) {
          this.currentlyExpandedCardId = card.queueId;
          this.loadCustomerInQueueCardDetails(card.id, card.queueId);
        }
      }
    }, 300);
  }

  async handleRefresh(event: any) {
    try {
      await this.loadCustomersInQueueCard();
    } finally {
      event.target.complete();
    }
  }


  public toggleCardDetails(card: CustomerInQueueCardModel): void {
    if (this.currentlyExpandedCardId === card.queueId) {
      this.currentlyExpandedCardId = null;
      this.cardDetailsMap.delete(card.queueId);
      this.qrCodeBase64 = null;
    } else {
      this.currentlyExpandedCardId = null;
      this.cardDetailsMap.clear();
      this.qrCodeBase64 = null;

      setTimeout(() => {
        this.currentlyExpandedCardId = card.queueId;
        this.loadCustomerInQueueCardDetails(card.id, card.queueId);
      });
    }
  }

  hasVariablePrice(queueId: number): boolean {
    const detalhes = this.cardDetailsMap.get(queueId);
    return detalhes?.services?.some(s => s.variablePrice && s.finalPrice === 0) ?? false;
  }

  public isCardExpanded(card: CustomerInQueueCardModel): boolean {
    return this.currentlyExpandedCardId === card.queueId;
  }

  public getCardDetails(card: CustomerInQueueCardModel): CustomerInQueueCardDetailModel | undefined {
    return this.cardDetailsMap.get(card.queueId);
  }

  private convertTimeStringToMinutes(timeString: string): number {
    const parts = timeString.split(':');
    if (parts.length < 3) return 0;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);

    return hours * 60 + minutes + seconds / 60;
  }

  public getTimeColor(timeToWait: number | string | undefined): string {
    if (!timeToWait)
      return '';

    let minutes: number;
    if (typeof timeToWait === 'string') {
      minutes = this.convertTimeStringToMinutes(timeToWait);
    } else {
      minutes = timeToWait;
    }

    if (minutes > 45)
      return 'vermelho';
    if (minutes > 15)
      return 'amarelo';
    return 'verde';
  }

  public formatEstimatedTime(timeToWait: number | string | undefined): string {
    if (!timeToWait)
      return 'Calculando...';

    if (typeof timeToWait === 'string') {
      const minutes = this.convertTimeStringToMinutes(timeToWait);

      if (minutes > 45) {
        const hours = minutes / 60;
        return `${Math.floor(hours)} hora(s) e ${Math.round(minutes % 60)} minuto(s)`;
      }
      return `${Math.round(minutes)} min`;
    }

    if (typeof timeToWait === 'number') {
      if (timeToWait > 45) {
        return `${Math.floor(timeToWait / 60)} hora(s) e ${Math.round(timeToWait % 60)} minuto(s)`;
      }
      return `${timeToWait} min`;
    }

    return 'Formato não reconhecido';
  }

  public generateQueuePeople(total: number): any[] {
    return Array.from({ length: total > 1 ? total : 1 }, (_, idx) => ({
      id: idx + 1,
      avatar: 'person-circle-outline'
    }));
  }

  public refreshQueues(): void {
    if (this.customerCards.length === 0) {
      this.loadCustomersInQueueCard();
      return;
    }

    const previouslyExpanded = this.currentlyExpandedCardId;
    this.currentlyExpandedCardId = null;
    this.cardDetailsMap.clear();
    this.qrCodeBase64 = null;

    this.loadCustomersInQueueCard();

    setTimeout(() => {
      if (previouslyExpanded !== null) {
        const card = this.customerCards.find(c => c.queueId === previouslyExpanded);
        if (card) {
          this.currentlyExpandedCardId = card.queueId;
          this.loadCustomerInQueueCardDetails(card.id, card.queueId);
        }
      }
    }, 300);
  }

  public loadCustomersInQueueCard(): void {
    this.customerCards = [];

    let userId = this.sessionService.getUser().id;

    this.queueService.getCustomerInQueueCard(userId).subscribe({
      next: (response) => {
        this.customerCards = response.data || [];
      },
      error: (err) => {
        console.error('Erro ao carregar filas:', err);
        this.customerCards = [];
      }
    });
  }

  private loadCustomerInQueueCardDetails(id: number, queueId: number): void {
    if (this.currentlyExpandedCardId !== queueId)
      return;

    this.queueService.getCustomerInQueueCardDetails(id, queueId).subscribe({
      next: (response) => {
        if (this.currentlyExpandedCardId === queueId) {
          this.cardDetailsMap.set(queueId, response.data);

          if (response.data.position === 0) {
            this.generateQrCode(response.data.token);
          }
        }
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes:', err);
        if (this.currentlyExpandedCardId === queueId) {
          this.currentlyExpandedCardId = null;
        }
      }
    });
  }

  private generateQrCode(token: string): void {
    this.queueService.gerarQrCode(token).subscribe({
      next: (res) => {
        this.qrCodeBase64 = res.qrCode;
      },
      error: (err) => {
        console.error('Erro ao gerar QR Code:', err);
      }
    });
  }

  public async exitQueue(card: CustomerInQueueCardModel): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Saída',
      message: 'Você tem certeza que deseja sair da fila?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: async () => {
            this.queueService.exitQueue(card.id, card.queueId).subscribe({
              next: async () => {
                await this.showToast('Você saiu da fila com sucesso!');
                this.loadCustomersInQueueCard();
              },
              error: async (err) => {
                console.error('Erro ao sair da fila:', err);
                await this.showToast('Ocorreu um erro ao sair da fila', 'danger');
              }
            });
          },
        },
      ],
    });
    await alert.present();
  }

  isTimeZero(time: number | string | null | undefined): boolean {
    if (!time) return false;
    return time === '00:00:00';
  }

  getIonicIcon(unicodeIcon: string): string {
    const iconMap: { [key: string]: string } = {
      '\\u{2702}': 'cut-outline',
      '\\u{2705}': 'checkmark-circle-outline',
      '\\u{1F4C8}': 'stats-chart-outline',
      '\\u{1F4C9}': 'stats-chart-outline',
      '\\u{1F4C6}': 'calendar-outline'
    };
    return iconMap[unicodeIcon] || 'construct-outline';
  }

  private async showToast(message: string, color: string = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: color
    });
    await toast.present();
  }

  public editarServicos(card: CustomerInQueueCardModel): void {
    this.router.navigate(['/select-services'], {
      queryParams: {
        queueId: card.queueId,
        storeId: card.storeId,
        customerId: card.id
      }
    });
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
  }

  get filteredCards() {
    if (!this.customerCards) return [];

    switch (this.activeFilter) {
      case 'active':
        return this.customerCards.filter(card =>
          card.status !== 6 && card.status !== 4
        );
      case 'waiting':
        return this.customerCards.filter(card => card.status === 6);
      default:
        return this.customerCards;
    }
  }

  getStatusClass(card: any): string {
    if (card.status === 2) return 'status-active';
    if (card.isPaused) return 'status-paused';
    return 'status-waiting';
  }

  getStatusIcon(card: any): string {
    if (card.status === 2) return 'checkmark-circle';
    if (card.isPaused) return 'pause-circle';
    return 'time';
  }

  getPositionClass(card: any): string {
    if (card.position === 0 || card.status === 2) return 'position-high';
    return 'position-normal';
  }

  getPositionText(card: any): string {
    if (card.status === 2) return 'Em atendimento';
    if (card.position === 0) return 'Sua vez!';
    return `${card.position}º na fila`;
  }

  getProgressWidth(position: number, total: number): number {
    if (position === 0) return 100;
    return ((total - position) / total) * 100;
  }

  public async presentInfoPopup(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Legenda',
      message: '',
      buttons: [
        {
          text: 'x',
          role: 'cancel'
        }
      ]
    });

    await alert.present();

    const modalElement = document.querySelector('.alert-message') as HTMLElement;
    if (modalElement) {
      modalElement.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <div style="width: 14px; height: 14px; border-radius: 50%; background-color: red; margin-right: 8px;"></div>
          <span><small>Ainda precisa esperar | > 60 min</small></span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <div style="width: 14px; height: 14px; border-radius: 50%; background-color: yellow; margin-right: 8px;"></div>
          <span><small>Sua vez está chegando | < 30 min</small></span>
        </div>
        <div style="display: flex; align-items: center;">
          <div style="width: 14px; height: 14px; border-radius: 50%; background-color: green; margin-right: 8px;"></div>
          <span><small>Você é o próximo | < 15 min</small></span>
        </div>
      `;
    }
  }
}