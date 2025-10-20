import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { QueueItem, ScheduleItem } from 'src/models/responses/dashboard-response';
import { UserModel } from 'src/models/user-model';
import { DashBoardService } from 'src/services/dashboard.service';
import { QueueService } from 'src/services/queue.service';
import { ScheduleService } from 'src/services/schedule.service';
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
  editingExistingAppointment: boolean = false;

  filteredAppointments: ScheduleItem[] = [];

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private dashBoardService: DashBoardService,
    private sessionService: SessionService,
    private queueService: QueueService,
    private scheduleService: ScheduleService,
    public router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    this.user = this.sessionService.getUser();
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.editingExistingAppointment = params['editingExistingAppointment'] === 'true';

      this.loadDashboardData(this.user.id);

      if (this.editingExistingAppointment) {
        this.loadSchedulesForDate();
      }
    });
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

          if (this.myQueues.length == 0) {
            this.activeSegment = 'agendamentos';
            this.collapseAll();
          }
        }
      },
      complete: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  changeDay(offset: number) {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + offset);

    const hasAppointment = this.myAppointments.some(appt =>
      this.isSameDay(new Date(appt.date), newDate)
    );

    this.selectedDate = newDate;

    if (hasAppointment) {
      this.loadSchedulesForDate();
    } else {
      this.loadDashboardData(this.user.id);
    }
  }

  nextDay() {
    this.changeDay(1);
  }

  previousDay() {
    this.changeDay(-1);
  }

  private loadSchedulesForDate() {
    this.isLoading = true;

    this.scheduleService.getCustomerScheduleForDay(this.user.id, this.selectedDate).subscribe({
      next: (schedules) => {
        this.myAppointments = schedules.data || [];
        this.filterAppointmentsByDate();
        this.collapseAll();
      },
      error: (err) => {
        console.error('Erro ao buscar agendamentos para o dia:', err);
        this.showToast('Erro ao carregar agendamentos do dia', 'danger');
      },
      complete: () => this.isLoading = false
    });
  }

  filterAppointmentsByDate() {
    const selDate = this.selectedDate;
    this.filteredAppointments = this.myAppointments.filter(appt => {
      const apptDate = new Date(appt.date);
      return apptDate.getFullYear() === selDate.getFullYear() &&
        apptDate.getMonth() === selDate.getMonth() &&
        apptDate.getDate() === selDate.getDate();
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

  public editQueueServices(card: QueueItem): void {
    this.router.navigate(['/select-services'], {
      queryParams: {
        queueId: card.id,
        storeId: card.store.id,
        customerId: card.customerId
      }
    });
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

  private getLocalAppointmentDate(appt: ScheduleItem): Date {
    // date vem em UTC (ex: "2025-10-20T03:00:00Z")
    const datePart = new Date(appt.date); // só pra extrair a data (dia/mês/ano)

    // time vem separado (ex: "10:00:00")
    const [hours, minutes, seconds] = appt.time.split(':').map(Number);

    // Monta a data local com o horário certo no fuso do dispositivo
    const localDate = new Date(
      datePart.getFullYear(),
      datePart.getMonth(),
      datePart.getDate(),
      hours,
      minutes,
      seconds
    );

    return localDate;
  }
  isUpcomingAppointment(appt: ScheduleItem): boolean {
    const now = new Date();
    const appointmentDate = this.getLocalAppointmentDate(appt);
    const timeDiff = appointmentDate.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff < 2 * 60 * 60 * 1000;
  }

  getTimeUntilAppointment(appt: ScheduleItem): string {
    const now = new Date();
    const appointmentDate = this.getLocalAppointmentDate(appt);
    const timeDiff = appointmentDate.getTime() - now.getTime();

    if (timeDiff <= 0) 
      return 'agora';

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) 
      return `${hours}h ${minutes}m`;
    return `${minutes} minutos`;
  }
  
  goToAppointment(appt: ScheduleItem) {
    this.activeSegment = 'agendamentos';
    this.expandedAppointmentId = appt.id;
    this.expandedQueueId = null;
    this.showToast(`Indo para agendamento: ${appt.store.name}`, 'primary');
  }

  goToQueue(queue: QueueItem) {
    this.activeSegment = 'filas';
    this.expandedQueueId = queue.id;
    this.expandedAppointmentId = null;
    this.showToast(`Indo para fila: ${queue.store.name}`, 'primary');
  }
  async refreshAll() {
    this.showToast('Atualizando dados...', 'primary');
    setTimeout(() => {
      this.loadDashboardData(this.user.id);
      this.showToast('Dados atualizados!', 'success');
    }, 800);
  }

  public async leaveQueue(card: QueueItem): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Saída',
      message: 'Você tem certeza que deseja sair da fila?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: async () => {
            this.queueService.exitQueue(card.customerId, card.id).subscribe({
              next: async () => {
                await this.showToast('Você saiu da fila com sucesso!', 'success');
                this.loadDashboardData(this.user.id);
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

  public editAppointmentServices(card: ScheduleItem): void {
    this.router.navigate(['/select-services'], {
      queryParams: {
        scheduleId: card.id,
        storeId: card.store.id,
        customerId: card.customerId,
        editingExistingAppointment: true,
      }
    });
  }

  public async cancelAppointment(card: ScheduleItem): Promise<void> {
    if (this.expandedAppointmentId === card.id) {
      this.expandedAppointmentId = null;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Agendamento',
      message: `Cancelar agendamento em ${card.store.name}?`,
      buttons: [
        { text: 'Manter', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: async () => {
            this.scheduleService.leavaSchedule(card.customerId, card.id).subscribe({
              next: async () => {
                this.myAppointments = this.myAppointments.filter(a => a.id !== card.id);
                this.updateCrossInformation();
                this.filterAppointmentsByDate();
                this.showToast('Agendamento cancelado!', 'warning');
                await this.showToast('Você saiu da fila com sucesso!', 'success');
                this.loadDashboardData(this.user.id);
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