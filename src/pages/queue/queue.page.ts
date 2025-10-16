import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

interface QueueItem {
  id: number;
  storeName: string;
  storeLogo?: string;
  serviceName: string;
  position: number;
  waitTime: number;
  paymentMethod: string;
  status: string;
  services: string[];
  totalInQueue?: number;
  arrivalTime?: string;
  isPaused?: boolean;
}

interface AppointmentItem {
  id: number;
  storeName: string;
  storeLogo?: string;
  serviceName: string;
  date: Date;
  time: string;
  status: string;
  services: string[];
  paymentMethod: string;
  notes?: string;
}

@Component({
  selector: 'app-queue',
  templateUrl: './queue.page.html',
  styleUrls: ['./queue.page.scss'],
})
export class QueuePage implements OnInit {
  fallbackRoute = '/home';
  currentDate = new Date();

  activeSegment: 'filas' | 'agendamentos' = 'filas';
  selectedDate: Date = new Date();

  expandedQueueId: number | null = null;
  expandedAppointmentId: number | null = null;

  myQueues: QueueItem[] = [];
  myAppointments: AppointmentItem[] = [];

  nextAppointment: AppointmentItem | null = null;
  nextQueue: QueueItem | null = null;

  filteredAppointments: AppointmentItem[] = [];

  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadMockData();
    this.updateCrossInformation();
    this.filterAppointmentsByDate();
  }


  loadMockData() {
    this.myQueues = [
      {
        id: 1,
        storeName: 'Barbearia Estilo Premium',
        storeLogo: 'https://yidudaduvasngangrydi.supabase.co/storage/v1/object/public/uploads/logo/5721731e-0301-45df-9799-aed397233717.jpeg',
        serviceName: 'Corte e Barba',
        position: 1,
        status: 'Próximo',
        waitTime: 5,
        paymentMethod: 'Cartão',
        services: ['Corte masculino', 'Barba', 'Hidratação'],
        totalInQueue: 8,
        arrivalTime: '14:30'
      },
      {
        id: 2,
        storeName: 'Salão da Ana Beauty',
        storeLogo: 'https://yidudaduvasngangrydi.supabase.co/storage/v1/object/public/uploads/logo/5721731e-0301-45df-9799-aed397233717.jpeg',
        serviceName: 'Coloração e Escova',
        position: 3,
        status: 'Aguardando',
        waitTime: 25,
        paymentMethod: 'Pix',
        services: ['Coloração', 'Escova progressiva'],
        totalInQueue: 5,
        arrivalTime: '15:15',
        isPaused: true
      },
    ];

    this.myAppointments = [
      {
        id: 1,
        storeName: 'Studio Beleza & Estética',
        storeLogo: 'https://yidudaduvasngangrydi.supabase.co/storage/v1/object/public/uploads/logo/9dae895d-9f27-42a1-81e6-1fb6c06f05aa.jpeg',
        serviceName: 'Corte Feminino + Hidratação',
        date: new Date(),
        time: '16:00',
        status: 'Confirmado',
        services: ['Corte feminino', 'Hidratação', 'Selagem'],
        paymentMethod: 'Dinheiro',
        notes: 'Trazer fotos de referência'
      },
      {
        id: 2,
        storeName: 'Spa Relax Total',
        storeLogo: 'https://yidudaduvasngangrydi.supabase.co/storage/v1/object/public/uploads/logo/9dae895d-9f27-42a1-81e6-1fb6c06f05aa.jpeg',
        serviceName: 'Massagem Relaxante Completa',
        date: new Date(new Date().setDate(new Date().getDate() + 1)),
        time: '15:30',
        status: 'Pendente',
        services: ['Massagem relaxante', 'Aromaterapia'],
        paymentMethod: 'Pix',
      },
    ];

    this.updateCrossInformation();
    this.filterAppointmentsByDate();
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

  getFilteredAppointments(): AppointmentItem[] {
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
      .filter(appt => appt.status === 'Confirmado')
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

  getQueueStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'Próximo': 'success',
      'Aguardando': 'warning',
      'Em andamento': 'primary',
      'Finalizado': 'medium'
    };
    return statusColors[status] || 'medium';
  }

  getQueueStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'Próximo': 'Sua vez!',
      'Aguardando': 'Aguardando',
      'Em andamento': 'Em andamento',
      'Finalizado': 'Finalizado'
    };
    return statusTexts[status] || status;
  }

  getAppointmentStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'Confirmado': 'success',
      'Pendente': 'warning',
      'Cancelado': 'danger',
      'Realizado': 'medium'
    };
    return statusColors[status] || 'medium';
  }

  getAppointmentColor(appt: AppointmentItem): string {
    if (appt.status === 'Confirmado')
      return 'var(--ion-color-success)';

    if (appt.status === 'Pendente')
      return 'var(--ion-color-warning)';

    if (appt.status === 'Cancelado')
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

  isUpcomingAppointment(appt: AppointmentItem): boolean {
    const now = new Date();
    const appointmentDate = new Date(appt.date);
    const timeDiff = appointmentDate.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff < 2 * 60 * 60 * 1000;
  }

  getTimeUntilAppointment(appt: AppointmentItem): string {
    const now = new Date();
    const appointmentDate = new Date(appt.date);
    const timeDiff = appointmentDate.getTime() - now.getTime();

    if (timeDiff <= 0) return 'agora';

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} minutos`;
  }


  goToAppointment(appt: AppointmentItem) {
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
      this.loadMockData();
      this.showToast('Dados atualizados!', 'success');
    }, 800);
  }

  async editQueueServices(queue: QueueItem) {
    if (this.expandedQueueId === queue.id) {
      this.expandedQueueId = null;
    }

    const alert = await this.alertController.create({
      header: 'Editar Serviços',
      message: `Deseja editar os serviços de <b>${queue.serviceName}</b>?`,
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
      message: `Tem certeza que deseja sair da fila de <b>${queue.storeName}</b>?`,
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

  async editAppointmentServices(appt: AppointmentItem) {
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

  async cancelAppointment(appt: AppointmentItem) {
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