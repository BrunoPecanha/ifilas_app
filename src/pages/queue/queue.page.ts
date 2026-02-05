import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonContent, ToastController } from '@ionic/angular';
import { firstValueFrom, Subscription } from 'rxjs';
import { QueueItem, ScheduleItem } from 'src/models/responses/dashboard-response';
import { UserModel } from 'src/models/user-model';
import { DashBoardService } from 'src/services/dashboard.service';
import { QueueService } from 'src/services/queue.service';
import { ScheduleService } from 'src/services/schedule.service';
import { SignalRService } from 'src/services/seignalr.service';
import { SessionService } from 'src/services/session.service';
import { ToastService } from 'src/services/toast.service';
import { TokenService } from 'src/services/token.service';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.page.html',
  styleUrls: ['./queue.page.scss'],
})
export class QueuePage implements AfterViewInit {
  @ViewChild(IonContent) content: IonContent = null as any;

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
  nextQueue!: QueueItem | null;
  editingExistingAppointment: boolean = false;

  private queueSignalRSub?: Subscription;
  private scheduleSignalRSub?: Subscription;

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
    private tokenService: TokenService,
    private signalRService: SignalRService
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

  async ionViewWillEnter() {
    await this.signalRService.startQueueConnection();

    this.queueSignalRSub = this.signalRService
      .onQueueUpdated$()
      .subscribe(() => {
        this.loadDashboardData(this.user.id);
      });

    this.scheduleSignalRSub = this.signalRService
      .onScheduleUpdated$()
      .subscribe(() => {
        this.loadDashboardData(this.user.id);
      });

    this.signalRService.onUpdateCustomerSchedule(() => {
      this.loadDashboardData(this.user.id);
    });

    this.loadCustomersAppointments();
  }

  ionViewWillLeave() {
    this.queueSignalRSub?.unsubscribe();
  }

  async loadCustomersAppointments() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.editingExistingAppointment = params['editingExistingAppointment'] === 'true';

      this.loadDashboardData(this.user.id);

      if (this.editingExistingAppointment) {
        this.loadSchedulesForDate();
      }
    });
  }

  async handleRefresh(event: any) {
    try {
      await this.loadCustomersAppointments();
    } finally {
      event.target.complete();
    }
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
      .filter(appt => appt.status === 9)
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
    const statusColors: Record<number, string> = {
      0: 'warning',
      1: 'medium',
      2: 'primary',
      3: 'medium',
      4: 'danger',
      5: 'danger',
      6: 'warning',
      7: 'danger',
      8: 'success',
      9: 'success',
      10: 'tertiary'
    };

    return statusColors[status] || 'medium';
  }

  getStatusInfo(status: number): { text: string; color: string } {
    const map: { [key: number]: { text: string; color: string } } = {
      0: { text: 'Aguardando', color: 'warning' },
      1: { text: 'Removido', color: 'medium' },
      2: { text: 'Em atendimento', color: 'primary' },
      3: { text: 'Finalizado', color: 'medium' },
      4: { text: 'Ausente', color: 'danger' },
      5: { text: 'Cancelado', color: 'danger' },
      6: { text: 'Pendente', color: 'warning' },
      7: { text: 'Recusado', color: 'danger' },
      8: { text: 'Próximo', color: 'warning' },
      9: { text: 'Confirmado', color: 'success' },
      10: { text: 'Agendado', color: 'tertiary' }
    };

    return map[status] || { text: 'Desconhecido', color: 'medium' };
  }

  isQueueReadOnly(status: number): boolean {
    return [2, 3, 5].includes(status);
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


  goToScheduling(): void {
    this.router.navigate(['/scheduling'], {
      queryParams: {
        storeId: null,
        returnTo: '/queue'
      }
    });
  }


  async selectDate(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Selecionar Data',
      inputs: [
        {
          name: 'selectedDate',
          type: 'date',
          value: this.selectedDate.toISOString().split('T')[0],
          min: new Date().toISOString().split('T')[0],
          max: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: (data) => {
            if (data.selectedDate) {
              const newDate = new Date(data.selectedDate);
              this.selectedDate = newDate;

              const hasAppointment = this.myAppointments.some(appt =>
                this.isSameDay(new Date(appt.date), newDate)
              );

              if (hasAppointment) {
                this.loadSchedulesForDate();
              } else {
                this.loadDashboardData(this.user.id);
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }


  findStores(): void {
    this.router.navigate(['/stores']);
  }

  onContentScroll(event: any): void {
    this.headerScrolled = event.detail.scrollTop > 50;
  }


  getMonthAbbreviation(date: Date): string {
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    return months[date.getMonth()];
  }


  getShortDayOfWeek(date: Date): string {
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    return days[date.getDay()];
  }

  isPeakHour(time: string): boolean {
    const hour = parseInt(time.split(':')[0]);
    return (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 20);
  }

  getServiceIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'Barbearia': 'cut-outline',
      'Salão': 'cut-outline',
      'Restaurante': 'restaurant-outline',
      'Consultório': 'medical-outline',
      'Academia': 'barbell-outline',
      'Padaria': 'cafe-outline',
      'Supermercado': 'cart-outline',
      'Farmácia': 'medical-outline',
      'Oficina': 'construct-outline',
      'Default': 'storefront-outline'
    };

    return iconMap[category] || iconMap['Default'];
  }


  getFriendlyTimeUntil(appt: ScheduleItem): string {
    const now = new Date();
    const appointmentDate = this.getLocalAppointmentDate(appt);
    const timeDiff = appointmentDate.getTime() - now.getTime();

    if (timeDiff <= 0) return 'Agora';

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}min`;
    }

    return 'Em breve';
  }


  formatCurrency(value: number | string): string {
    if (!value) return 'R$ 0,00';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(numValue);
  }


  getGradientColor(position: number): string {
    if (position === 1) return 'linear-gradient(135deg, #4cd964, #5ac8fa)';
    if (position <= 3) return 'linear-gradient(135deg, #ff9500, #ffcc00)';
    if (position <= 10) return 'linear-gradient(135deg, #007aff, #5856d6)';
    return 'linear-gradient(135deg, #8e8e93, #c7c7cc)';
  }

  getPositionEmoji(position: number): string {
    if (position === 1) return '👑';
    if (position <= 3) return '🔥';
    if (position <= 10) return '⚡';
    return '⏳';
  }


  shouldShowHighlightCard(): boolean {
    if (this.activeSegment === 'filas') {
      return !!this.nextAppointment;
    } else {
      return !!this.nextQueue;
    }
  }


  async switchSegment(segment: 'filas' | 'agendamentos'): Promise<void> {
    if (this.activeSegment === segment) return;

    this.collapseAll();

    this.activeSegment = segment;

    await new Promise(resolve => setTimeout(resolve, 100));

    this.content.scrollToTop(200);
  }


  onCardLongPress(item: any, type: 'queue' | 'appointment'): void {
    console.log('Long press on', type, item.id);
  }


  async openStoreLocation(store: any): Promise<void> {
    if (store.latitude && store.longitude) {
      const url = `https://maps.google.com/?q=${store.latitude},${store.longitude}`;
      window.open(url, '_blank');
    } else {
      this.toastService.show('Localização não disponível', 'warning');
    }
  }

  async shareItem(item: any, type: 'queue' | 'appointment'): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: type === 'queue' ? 'Minha posição na fila' : 'Meu agendamento',
          text: `Estou ${type === 'queue' ? 'na fila do' : 'com agendamento no'} ${item.store.name}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      this.toastService.show('Compartilhamento não suportado no seu dispositivo', 'warning');
    }
  }

  getAverageWaitTime(queue: QueueItem): string {
    if (!queue.waitingTime) return 'Indisponível';

    const timeStr = queue.waitingTime.slice(0, 5);
    const [hours, minutes] = timeStr.split(':').map(Number);

    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    } else if (hours === 1) {
      return `1h ${minutes}min`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  }
}