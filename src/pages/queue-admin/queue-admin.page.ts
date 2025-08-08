import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { QueueService } from 'src/services/queue.service';
import { StoreModel } from 'src/models/store-model';
import { SessionService } from 'src/services/session.service';
import { QueueModel } from 'src/models/queue-model';
import { StatusQueueEnum } from 'src/models/enums/status-queue.enum';
import { StoresService } from 'src/services/stores.service';
import { ProfessionalResponse } from 'src/models/responses/professional-response';
import { QueueFilterRequest } from 'src/models/requests/queue-filter-request';
import { ToastService } from 'src/services/toast.service';
import { QueuePauseRequest } from 'src/models/requests/queue-pause-request';
import { SignalRService } from 'src/services/seignalr.service';
import { QueueCloseRequest } from 'src/models/requests/queue-close-request';
import { isToday } from 'src/utils/date-utils';

@Component({
  selector: 'app-queue-admin',
  templateUrl: './queue-admin.page.html',
  styleUrls: ['./queue-admin.page.scss'],
})
export class QueueAdminPage implements OnInit {
  public _statusQueueEnum = StatusQueueEnum;

  searchQuery = '';
  activeFilter: 'today' | 'all' | 'custom' = 'today';
  startDate = '';
  endDate = '';
  selectedResponsible: number | null = null;
  selectedStatus: number | null = null;

  store: StoreModel = {} as StoreModel;
  queues: QueueModel[] = [];
  originalQueues: QueueModel[] = [];
  responsibles: { id: string; nome: string }[] = [];
  anyQueueOpen: boolean = false;

  today = this.getHourFromBrazilianTimeZone();

  constructor(
    private alertController: AlertController,
    private router: Router,
    private user: SessionService,
    private queueService: QueueService,
    private sessionService: SessionService,
    private storeService: StoresService,
    private toast: ToastService,
    private signalRService: SignalRService
  ) {
    this.store = this.sessionService.getStore();
    this.selectedResponsible = this.user.getUser()?.id || null;
  }

  ngOnInit() {
    this.activeFilter = 'all';
    this.loadInitialData();
  }

  private loadInitialData() {
    this.loadProfessionals();
    this.loadQueuesWithCurrentFilters();
    this.initSignalRConnection();
  }

  private async initSignalRConnection() {
    try {
      await this.signalRService.startQueueConnection();

      const groupName = this.store.id.toString();
      await this.signalRService.joinQueueGroup(groupName);

      this.signalRService.offUpdateQueue();
      this.signalRService.onUpdateQueue(() => {
        this.loadQueuesWithCurrentFilters();
      });

    } catch (error) {
      console.error('Erro SignalR:', error);
      setTimeout(() => this.initSignalRConnection(), 5000);
    }
  }

  private loadProfessionals() {
    this.storeService.loadProfessionals(Number(this.store.id)).subscribe({
      next: (response: ProfessionalResponse) => {
        if (response.valid && response.data) {
          this.responsibles = Array.isArray(response.data)
            ? response.data.map(prof => ({
              id: prof.id.toString(),
              nome: prof.name
            }))
            : [{
              id: response.data.id.toString(),
              nome: response.data.name
            }];
        }
      },
      error: (err) => console.error('Erro ao carregar profissionais:', err)
    });
  }

  private buildCurrentFilters(): QueueFilterRequest {
    let _startDate: Date | null = null;
    let _endDate: Date | null = null;

    if (this.activeFilter === 'custom' && this.startDate && this.endDate) {
      _startDate = new Date(this.startDate);
      _startDate.setHours(0, 0, 0, 0);

      _endDate = new Date(this.endDate);
      _endDate.setHours(23, 59, 59, 999);
    } else if (this.activeFilter === 'today') {
      const today = new Date();
      _startDate = new Date(today);
      _startDate.setHours(0, 0, 0, 0);
      _endDate = new Date(today);
      _endDate.setHours(23, 59, 59, 999);
    } else if (this.activeFilter === 'all') {
      _startDate = null;
      _endDate = null;
    }
        
    return {      
      startDate: _startDate,
      endDate: _endDate,
      queueStatus: this.selectedStatus ?? undefined,
      responsibleId: this.store.shareQueue ? undefined : this.selectedResponsible
    };
  }

  private loadQueuesWithCurrentFilters() {
    const filter = this.buildCurrentFilters();

    this.queueService.loadAllTodayQueue(this.store.id, filter).subscribe({
      next: (response) => {
        this.queues = response.data || [];
        this.originalQueues = [...this.queues];
        this.applyLocalFilters();
      },
      error: (err) => {
        console.error('Erro ao carregar filas:', err);
        this.queues = [];
        this.originalQueues = [];
      }
    });
  }

  handleRefresh(event: any) {
    const filter = this.buildCurrentFilters();

    this.queueService.loadAllTodayQueue(this.store.id, filter).subscribe({
      next: (response) => {
        this.queues = response.data || [];
        this.originalQueues = [...this.queues];
        this.applyLocalFilters();
        event.target.complete();
      },
      error: (err) => {
        console.error('Erro ao atualizar filas:', err);
        event.target.complete();
      }
    });
  }

  applyLocalFilters() {
    if (!this.originalQueues?.length) {
      this.queues = [];
      return;
    }

    let filtered = [...this.originalQueues];

    if (this.searchQuery) {
      filtered = filtered.filter(queue =>
        queue.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    this.queues = filtered;
    this.anyQueueOpenStatus(filtered);
  }

  applyCustomFilters() {
    if (this.activeFilter === 'custom') {
      if (!this.startDate || !this.endDate) {
        this.toast.show('Selecione as datas inicial e final.', 'danger');
        return;
      }
      this.loadQueuesWithCurrentFilters();
    }
  }

  clearFilters() {
    this.selectedStatus = null;
    this.selectedResponsible = null;
    this.startDate = '';
    this.endDate = '';
    this.activeFilter = 'today';
    this.loadQueuesWithCurrentFilters();
  }

  hasActiveFilters(): boolean {
    return this.activeFilter !== 'today' ||
      this.selectedResponsible !== null ||
      this.selectedStatus !== null ||
      !!this.searchQuery;
  }

  isQueueOpen(queue: QueueModel): boolean {
    return queue.status === this._statusQueueEnum.open;
  }

  anyQueueOpenStatus(queues: QueueModel[]): void {
    this.anyQueueOpen = queues.some(queue => queue.status === this._statusQueueEnum.open);
  }

  filterChanged() {
    if (this.activeFilter === 'custom') {
      this.queues = [];
      this.originalQueues = [];
    } else {
      this.loadQueuesWithCurrentFilters();
    }
  }

  onStatusChange() {
    if (this.activeFilter !== 'custom') {
      this.loadQueuesWithCurrentFilters();
    }
  }

  onResponsibleChange() {
    if (this.activeFilter !== 'custom') {
      this.loadQueuesWithCurrentFilters();
    }
  }

  get filteredQueues(): QueueModel[] {
    if (!this.queues?.length) return [];

    let filtered = [...this.queues];

    if (this.searchQuery) {
      const searchTerm = this.searchQuery.toLowerCase();
      filtered = filtered.filter(queue =>
        queue.name.toLowerCase().includes(searchTerm) ||
        (queue.description && queue.description.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  }

  getQueueIcon(queueName: string): string {
    const name = queueName.toLowerCase();
    if (name.includes('clínico')) return 'medkit-outline';
    if (name.includes('pediatria')) return 'happy-outline';
    if (name.includes('cardio')) return 'heart-outline';
    if (name.includes('ortopedia')) return 'body-outline';
    if (name.includes('dermato')) return 'sparkles-outline';
    return 'list-outline';
  }

  getQueueLabel(queue: QueueModel): string {
    switch (queue.status) {
      case this._statusQueueEnum.open:
        return 'ABERTA';
      case this._statusQueueEnum.closed:
        return 'FECHADA';
      case this._statusQueueEnum.paused:
        return 'PAUSADA';
      default:
        return 'INDEFINIDA';
    }
  }

  getQueueColor(queue: QueueModel): string {
    switch (queue.status) {
      case this._statusQueueEnum.open:
        return 'success';
      case this._statusQueueEnum.closed:
        return 'medium';
      case this._statusQueueEnum.paused:
        return 'warning';
      default:
        return 'dark';
    }
  }

  openAddQueuePage() {
    this.router.navigate(['/new-queue'], {
      state: {
        queue: {
          name: 'Nova Fila',
          date: this.today,
          responsibleId: this.selectedResponsible || 1
        }
      }
    });
  }

  editQueue(queue: QueueModel) {
    this.router.navigate(['/edit-queue', queue.id], {
      state: { queue }
    });
  }

  viewQueueDetails(queue: QueueModel) {
    this.router.navigate(['/queue-details', queue.id]);
  }

  async pauseQueue(queue: QueueModel) {
    const alert = await this.alertController.create({
      header: 'Pausar Fila',
      subHeader: `Informe o motivo (máx. 40 caracteres)`,
      inputs: [
        {
          name: 'pauseReason',
          type: 'text',
          placeholder: 'Motivo da pausa',
          attributes: {
            maxlength: 40
          }
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: (data) => {
            const reason = data.pauseReason?.trim();
            if (!reason) {
              this.toast.show('Motivo é obrigatório.', 'warning');
              return false;
            }
            const request: QueuePauseRequest = {
              id: queue.id,
              pauseReason: reason
            };
            this.queueService.pauseQueue(request).subscribe({
              next: () => {
                this.loadQueuesWithCurrentFilters();
                this.toast.show(`Fila "${queue.name}" pausada.`, 'warning');
              },
              error: () => {
                this.toast.show(`Erro ao pausar fila "${queue.name}".`, 'danger');
              }
            });
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async unpauseQueue(queue: QueueModel) {
    const request: QueuePauseRequest = {
      id: queue.id,
      pauseReason: ''
    };
    this.queueService.pauseQueue(request).subscribe({
      next: () => {
        this.loadQueuesWithCurrentFilters();
        this.toast.show(`Fila "${queue.name}" despausada.`, 'success');
      },
      error: () => {
        this.toast.show(`Erro ao despausar fila "${queue.name}".`, 'danger');
      }
    });
  }

  async closeQueue(queue: QueueModel) {
    const alert = await this.alertController.create({
      header: 'Fechar Fila',
      message: `Deseja fechar a fila "${queue.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Fechar',
          handler: () => {
            const command: QueueCloseRequest = {
              id: queue.id,
              closeReason: ''
            };
            this.queueService.closeQueue(command).subscribe({
              next: () => {
                this.loadQueuesWithCurrentFilters();
                this.toast.show(`Fila "${queue.name}" fechada.`, 'success');
              },
              error: () => {
                this.toast.show(`Erro ao fechar fila "${queue.name}".`, 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteQueue(queue: QueueModel) {
    const alert = await this.alertController.create({
      header: 'Excluir Fila',
      message: `Deseja excluir a fila "${queue.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          handler: () => {
            this.queueService.deleteQueue(queue.id).subscribe({
              next: () => {
                this.loadQueuesWithCurrentFilters();
                this.toast.show(`Fila "${queue.name}" excluída.`, 'success');
              },
              error: () => {
                this.toast.show(`Erro ao excluir fila "${queue.name}".`, 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  private getHourFromBrazilianTimeZone(): string {
    return new Date().toISOString();
  }
}
