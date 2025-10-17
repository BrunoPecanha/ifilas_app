import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { QueueItem, ScheduleItem } from 'src/models/responses/dashboard-response';
import { UserModel } from 'src/models/user-model';
import { DashBoardService } from 'src/services/dashboard.service';
import { SessionService } from 'src/services/session.service';


@Component({
  selector: 'app-queue',
  templateUrl: './queue.page.html',
  styleUrls: ['./queue.page.scss'],
})
export class QueuePage implements OnInit {
  fallbackRoute = '/home';
  currentDate = new Date();
  user!: UserModel;
  isLoading = false;

  activeSegment: 'filas' | 'agendamentos' = 'filas';
  selectedDate: Date = new Date();

  expandedQueueId: number | null = null;
  expandedAppointmentId: number | null = null;

  myQueues: QueueItem[] = [];
  myAppointments: ScheduleItem[] = [];

  nextAppointment: ScheduleItem | null = null;
  nextQueue: QueueItem | null = null;

  filteredAppointments: ScheduleItem[] = [];

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private dashBoardService: DashBoardService,
    private sessionService: SessionService
  ) {
    this.user = this.sessionService.getUser();
  }

  ngOnInit() {
    this.loadDashboardData(this.user.id);
  }

  loadDashboardData(id: number) {
    this.isLoading = true;
    this.dashBoardService.loadCustomerInfo(id).subscribe({
      next: (response) => {
        if (response.valid) {
          this.myQueues = response.data.queues || [];
          this.myAppointments = response.data.schedules || [];
          this.updateCrossInformation();
          this.filterAppointmentsByDate();
        }
      },
      complete: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }

  nextDay() {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    this.selectedDate = newDate;
    this.filterAppointmentsByDate();
    this.collapseAll();
  }

  previousDay() {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    this.selectedDate = newDate;
    this.filterAppointmentsByDate();
    this.collapseAll();
  }

  filterAppointmentsByDate() {
    this.filteredAppointments = this.myAppointments.filter(appt => {
      const apptDate = new Date(appt.date);
      const selectedDate = new Date(this.selectedDate);

      return apptDate.toDateString() === selectedDate.toDateString();
    });
  }

  getFilteredAppointments(): ScheduleItem[] {
    return this.filteredAppointments;
  }

  getDayOfWeek(date: Date): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[date.getDay()];
  }


  toggleQueueExpansion(queueId: number) {
    if (this.expandedQueueId === queueId) {
      this.expandedQueueId = null;
    } else {
      this.expandedQueueId = queueId;
      this.expandedAppointmentId = null;
    }
  }

  toggleAppointmentExpansion(appointmentId: number) {
    if (this.expandedAppointmentId === appointmentId) {
      this.expandedAppointmentId = null;
    } else {
      this.expandedAppointmentId = appointmentId;
      this.expandedQueueId = null;
    }
  }


  updateCrossInformation() {
    this.nextAppointment = this.myAppointments
      .filter(appt => appt.status === 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null;


    this.nextQueue = this.myQueues
      .filter(queue => queue.position > 0)
      .sort((a, b) => a.position - b.position)[0] || null;
  }

  getServiceColor(service: string): string {
    const colorMap: { [key: string]: string } = {
      'Corte masculino': 'primary',
      'Barba': 'secondary',
      'Hidratação': 'success',
      'Coloração': 'tertiary',
      'Escova progressiva': 'warning',
      'Corte feminino': 'danger',
      'Selagem': 'medium',
      'Massagem relaxante': 'success',
      'Aromaterapia': 'tertiary'
    };
    return colorMap[service] || 'medium';
  }

  getQueueStatusColor(status: number): string {
    const statusColors: { [key: number]: string } = {
      6: 'success',
      2: 'warning',
      1: 'medium',
      3: 'primary'
    };
    return statusColors[status] || 'medium';
  }

  getQueueStatusText(status: number): string {
    const statusTexts: { [key: number]: string } = {
      6: 'Sua vez!',
      2: 'Aguardando',
      1: 'Em andamento',
      3: 'Finalizado'
    };
    return statusTexts[status] || 'Desconhecido';
  }

  getAppointmentStatusText(status: number): string {
    const statusTexts: { [key: number]: string } = {
      0: 'Confirmado',
      1: 'Pendente',
      2: 'Cancelado',
      3: 'Finalizado'
    };
    return statusTexts[status] || 'Desconhecido';
  }

  getAppointmentStatusColor(status: number): string {
    const statusColors: { [key: number]: string } = {
      0: 'success',
      1: 'warning',
      2: 'danger',
      3: 'medium'
    };
    return statusColors[status] || 'medium';
  }

  getAppointmentColor(appt: ScheduleItem): string {
    if (appt.status === 0)
      return 'var(--ion-color-success)';

    if (appt.status === 1)
      return 'var(--ion-color-warning)';

    if (appt.status === 2)
      return 'var(--ion-color-danger)';

    return 'var(--ion-color-medium)';
  }

  getPriorityColor(position: number): string {
    if (position === 1)
      return 'var(--ion-color-success)';
    if (position <= 3)
      return 'var(--ion-color-warning)';

    return 'var(--ion-color-medium)';
  }

  getQueueProgress(queue: QueueItem): number {
    if (!queue.totalInQueue) return 0;
    return ((queue.totalInQueue - queue.position) / queue.totalInQueue) * 100;
  }

  isUpcomingAppointment(appt: ScheduleItem): boolean {
    const now = new Date();
    const appointmentDate = new Date(appt.date);
    const timeDiff = appointmentDate.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff < 2 * 60 * 60 * 1000;
  }

  getTimeUntilAppointment(appt: ScheduleItem): string {
    const now = new Date();
    const appointmentDate = new Date(appt.date);
    const timeDiff = appointmentDate.getTime() - now.getTime();

    if (timeDiff <= 0) return 'agora';

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} minutos`;
  }


  goToAppointment(appt: ScheduleItem) {
    this.activeSegment = 'agendamentos';
    this.expandedAppointmentId = appt.id;
    this.expandedQueueId = null;
    this.showToast(`Indo para agendamento: ${appt.storeName}`, 'primary');
  }

  goToQueue(queue: QueueItem) {
    this.activeSegment = 'filas';
    this.expandedQueueId = queue.id;
    this.expandedAppointmentId = null;
    this.showToast(`Indo para fila: ${queue.storeName}`, 'primary');
  }

  findQueues() {
    this.showToast('Buscando filas disponíveis...', 'primary');
  }

  scheduleAppointment() {
    this.showToast('Abrindo agendamentos...', 'primary');
  }


  async refreshAll() {
    this.showToast('Atualizando dados...', 'primary');
    setTimeout(() => {
      this.loadDashboardData(this.user.id);
      this.showToast('Dados atualizados!', 'success');
    }, 800);
  }

  async editQueueServices(queue: QueueItem) {
    if (this.expandedQueueId === queue.id) {
      this.expandedQueueId = null;
    }

    const alert = await this.alertController.create({
      header: 'Editar Serviços',
      message: `Deseja editar os serviços?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Editar',
          handler: () => {
            this.showToast('Editando serviços...', 'warning');
          }
        }
      ],
    });
    await alert.present();
  }

  async leaveQueue(queue: QueueItem) {
    if (this.expandedQueueId === queue.id) {
      this.expandedQueueId = null;
    }

    const alert = await this.alertController.create({
      header: 'Sair da Fila',
      message: `Tem certeza que deseja sair da fila de ${queue.storeName}`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          handler: () => {
            this.myQueues = this.myQueues.filter(q => q.id !== queue.id);
            this.updateCrossInformation();
            this.showToast('Você saiu da fila!', 'warning');
          }
        }
      ],
    });
    await alert.present();
  }

  async editAppointmentServices(appt: ScheduleItem) {
    if (this.expandedAppointmentId === appt.id) {
      this.expandedAppointmentId = null;
    }

    const alert = await this.alertController.create({
      header: 'Editar Agendamento',
      message: `Editar agendamento para <b>${appt.storeName}</b>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Editar',
          handler: () => {
            this.showToast('Editando agendamento...', 'warning');
          }
        }
      ],
    });
    await alert.present();
  }

  async cancelAppointment(appt: ScheduleItem) {
    if (this.expandedAppointmentId === appt.id) {
      this.expandedAppointmentId = null;
    }

    const alert = await this.alertController.create({
      header: 'Cancelar Agendamento',
      message: `Cancelar agendamento em <b>${appt.storeName}</b>?`,
      buttons: [
        { text: 'Manter', role: 'cancel' },
        {
          text: 'Cancelar',
          handler: () => {
            this.myAppointments = this.myAppointments.filter(a => a.id !== appt.id);
            this.updateCrossInformation();
            this.filterAppointmentsByDate();
            this.showToast('Agendamento cancelado!', 'warning');
          }
        }
      ],
    });
    await alert.present();
  }

  handleImageError(event: any) {
    event.target.src = '';
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }


  collapseAll() {
    this.expandedQueueId = null;
    this.expandedAppointmentId = null;
  }

  hasExpandedCard(): boolean {
    return this.expandedQueueId !== null || this.expandedAppointmentId !== null;
  }

  expandFirstCard() {
    if (this.activeSegment === 'filas' && this.myQueues.length > 0) {
      this.expandedQueueId = this.myQueues[0].id;
      this.expandedAppointmentId = null;
    } else if (this.activeSegment === 'agendamentos' && this.getFilteredAppointments().length > 0) {
      this.expandedAppointmentId = this.getFilteredAppointments()[0].id;
      this.expandedQueueId = null;
    }
  }

  pauseInfo(queue: QueueItem) {
    this.showToast(queue.isPaused ? 'Fila pausada - Motivo: Saí para almoçar' : 'Fila ativa', 'medium');
  }
}