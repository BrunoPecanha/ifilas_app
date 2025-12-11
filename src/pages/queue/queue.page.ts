import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonContent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { QueueItem, ScheduleItem } from 'src/models/responses/dashboard-response';
import { UserModel } from 'src/models/user-model';
import { DashBoardService } from 'src/services/dashboard.service';
import { QueueService } from 'src/services/queue.service';
import { ScheduleService } from 'src/services/schedule.service';
import { SessionService } from 'src/services/session.service';
import { ToastService } from 'src/services/toast.service';
import { TokenService } from 'src/services/token.service';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.page.html',
  styleUrls: ['./queue.page.scss'],
})
export class QueuePage implements AfterViewInit  {
  @ViewChild(IonContent) content: IonContent = null as any;
  @ViewChild(IonContent, { static: false }) ionContent!: IonContent;

  currentDate = new Date();
  user!: UserModel;
  isLoading = false;
  showQrModal = false;
  isLoadingQr = false;
  headerScrolled = false;

  qrCodeDataUrl: string = '';

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
    private toastService: ToastService,
    private dashBoardService: DashBoardService,
    private sessionService: SessionService,
    private queueService: QueueService,
    private scheduleService: ScheduleService,
    public router: Router,
    private activatedRoute: ActivatedRoute,
    private tokenService: TokenService
  ) {
    this.user = this.sessionService.getUser();
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
        this.toastService.show('Erro ao carregar agendamentos do dia', 'danger');
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
    const wasExpanded = this.expandedQueueId === queueId;

    if (wasExpanded) {
      this.expandedQueueId = null;
      this.expandedAppointmentId = null;
      return;
    }

    this.expandedQueueId = queueId;
    this.expandedAppointmentId = null;

    setTimeout(() => {
      this.scrollToExpandedCard(queueId.toString(), 'queue');
    }, 100);
  }

  toggleAppointmentExpansion(appointmentId: number) {
    const wasExpanded = this.expandedAppointmentId === appointmentId;

    if (wasExpanded) {
      this.expandedAppointmentId = null;
      this.expandedQueueId = null;
      return;
    }

    this.expandedAppointmentId = appointmentId;
    this.expandedQueueId = null;

    setTimeout(() => {
      this.scrollToExpandedCard(appointmentId.toString(), 'appointment');
    }, 100);
  }

  private scrollToExpandedCard(cardId: string, type: 'queue' | 'appointment') {
    const elementId = `${type}-${cardId}`;
    const element = document.getElementById(elementId);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
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
      3: 'primary',
      4: 'danger'
    };
    return statusColors[status] || 'medium';
  }

  getStatusInfo(status: number): { text: string; color: string } {
  const map: { [key: number]: { text: string; color: string } } = {
    0: { text: 'Aguardando', color: 'warning' },           // Waiting
    1: { text: 'Removido', color: 'medium' },              // Removed
    2: { text: 'Em atendimento', color: 'primary' },       // InService
    3: { text: 'Finalizado', color: 'medium' },            // Done
    4: { text: 'Ausente', color: 'danger' },               // Absent
    5: { text: 'Cancelado', color: 'danger' },             // Canceled
    6: { text: 'Sua vez!', color: 'success' },             // Next
    7: { text: 'Pendente', color: 'warning' },             // Pending
    8: { text: 'Recusado', color: 'danger' },              // Rejected
    9: { text: 'Confirmado', color: 'success' },           // Confirmed
    10: { text: 'Agendado', color: 'tertiary' }            // Scheduled
  };

  return map[status] || { text: 'Desconhecido', color: 'medium' };
}


  getAppointmentColor(appt: ScheduleItem): string {
    if (appt.status === 9)
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
    if (!queue.totalInQueue) 
      return 0;

    return ((queue.totalInQueue - queue.position) / queue.totalInQueue) * 100;
  }

  private getLocalAppointmentDate(appt: ScheduleItem): Date {
    const datePart = new Date(appt.date);
    const [hours, minutes, seconds] = appt.time.split(':').map(Number);

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
    this.toastService.show(`Indo para agendamento: ${appt.store.name}`, 'success');
  }

  goToQueue(queue: QueueItem) {
    this.activeSegment = 'filas';
    this.expandedQueueId = queue.id;
    this.expandedAppointmentId = null;
    this.toastService.show(`Indo para fila: ${queue.store.name}`, 'success');
  }

  async refreshAll() {
    this.toastService.show('Atualizando dados...', 'success');
    setTimeout(() => {
      this.loadDashboardData(this.user.id);
      this.toastService.show('Dados atualizados!', 'success');
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
                await this.toastService.show('Você saiu da fila com sucesso!', 'success');
                this.loadDashboardData(this.user.id);
              },
              error: async (err) => {
                console.error('Erro ao sair da fila:', err);
                await this.toastService.show('Ocorreu um erro ao sair da fila', 'danger');
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
            this.scheduleService.leavaSchedule(card.customerId).subscribe({
              next: async () => {
                this.myAppointments = this.myAppointments.filter(a => a.id !== card.id);
                this.updateCrossInformation();
                this.filterAppointmentsByDate();
                this.toastService.show('Agendamento cancelado!', 'warning');
                await this.toastService.show('Você saiu da fila com sucesso!', 'success');
                this.loadDashboardData(this.user.id);
              },
              error: async (err) => {
                console.error('Erro ao sair da fila:', err);
                await this.toastService.show('Ocorreu um erro ao sair da fila', 'danger');
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

  trackById(index: number, item: any): number {
    return item.id;
  }  

  async generateQrCodeForAtendance(item: QueueItem | ScheduleItem) {
    this.isLoadingQr = true;
    this.showQrModal = true;

    try {
      const response = await firstValueFrom(
        this.tokenService.generate(item.customerId, item.id)
      );

      this.qrCodeDataUrl = response.startsWith('data:image')
        ? response
        : 'data:image/png;base64,' + response;
    } catch (err) {
      this.toastService.show('Erro ao gerar QR Code', 'danger');
      this.qrCodeDataUrl = '';
    } finally {
      this.isLoadingQr = false;
    }
  }

  closeQrModal() {
    this.showQrModal = false;
    this.qrCodeDataUrl = '';
    this.isLoadingQr = false;
  }

  async copyQrCode() {
    try {
      await navigator.clipboard.writeText(this.qrCodeDataUrl);
      this.toastService.show('QR Code copiado para a área de transferência', 'success');
    } catch {
      this.toastService.show('Não foi possível copiar o QR Code', 'danger');
    }
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
    this.toastService.show(
      queue.isPaused
        ? `Fila pausada: ${queue.pauseReason}`
        : 'Fila ativa',
      'medium'
    );
  }
}