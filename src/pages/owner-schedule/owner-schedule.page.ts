import { Component, OnInit, QueryList, ViewChild, ViewChildren, AfterViewInit } from "@angular/core";
import { ScheduleService } from "src/services/schedule.service";
import { CdkDragDrop, CdkDragMove, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { UserModel } from "src/models/user-model";
import { SessionService } from "src/services/session.service";
import { StoresService } from "src/services/stores.service";
import { StoreModel } from "src/models/store-model";
import { ToastService } from "src/services/toast.service";
import { Router } from "@angular/router";
import { AlertController, IonContent, ModalController, Platform } from "@ionic/angular";
import { TransferCustomerModalComponent } from "./modals/transfer-modal/transfer-customer-modal.component";
import { CustomerService } from "src/services/customer.service";
import { SignalRService } from "src/services/seignalr.service";
import { Subscription } from "rxjs";
import { CustomerDetailModalComponent } from "./modals/detail-modal/customer-detail-modal.component";
import { CpfSearchModalComponent } from "./modals/cpf-search-modal/cpf-search-modal.component";
import { CustomerTypeModalComponent } from "./modals/customer-type-modal/customer-type-modal.component";
import { WalkInCustomerModalComponent } from "./modals/walk-in-customer-modal/walk-in-customer-modal.component";
import { CustomerModel } from "src/models/customer-model";
import { ServiceConfigModalComponent } from "src/shared/components/service-config-modal-component/service-config-modal.component";
import { EditServiceComponent } from "./modals/edit-service-modal/edit-service-modal.component";

@Component({
  selector: "app-owner-schedule",
  templateUrl: "./owner-schedule.page.html",
  styleUrls: ["./owner-schedule.page.scss"],
})
export class OwnerSchedulePage implements OnInit, AfterViewInit {
  @ViewChildren('slotList', { read: CdkDropList }) slotLists!: QueryList<CdkDropList>;
  @ViewChild('content', { static: false }) content!: IonContent;

  @ViewChild('datetimeModal') datetimeModal: any;

  selectedTimeSlots: any[] = [];
  allDropListIds: string[] = [];
  filteredTimeSlots: any[] = [];
  preSelectedSlot: any = null;
  professionals: any[] = [];
  selectedFilter: string = 'all';

  private originalSlotsTemplate: { time: string }[] = [];

  currentView: 'grid' | 'list' = 'grid';
  searchTerm: string = '';
  searchQuery: string = '';
  isDragging = false;
  user!: UserModel;
  store!: StoreModel;
  showFilters = false;
  scheduleId: number = 0;
  employeeCanSeeAmount = true;

  selectedCustomer: any = {};
  modalMode: 'qrcode' | 'services' | 'summary' = 'summary';
  isModalOpen = false;
  private signalRSub?: Subscription;

  appointments: any[] = [];

  slotDuration = 30;

  longPressTimer: any;
  longPressThreshold = 500;
  customerBeingLongPressed: any = null;
  isLongPressing = false;

  serviceFilters: any[] = [];
  connectedDropLists: CdkDropList[] = [];

  selectedDate: Date = new Date();
  weekDays: any[] = [];

  statusFilters = [
    { value: 'waiting', label: 'Aguardando', selected: false, count: 0, color: 'medium' },
    { value: 'pending', label: 'Pendente', selected: false, count: 0, color: 'warning' },
    { value: 'confirmed', label: 'Confirmado', selected: false, count: 0, color: 'primary' },
    { value: 'inservice', label: 'Em Atendimento', selected: false, count: 0, color: 'secondary' },
    { value: 'done', label: 'Realizado', selected: false, count: 0, color: 'success' },
    { value: 'absent', label: 'Ausente', selected: false, count: 0, color: 'danger' },
    { value: 'cancelled', label: 'Cancelado', selected: false, count: 0, color: 'danger' },
    { value: 'scheduled', label: 'Agendado', selected: false, count: 0, color: 'tertiary' }
  ];

  constructor(
    private service: ScheduleService,
    private sessionService: SessionService,
    private toastController: ToastService,
    private modalController: ModalController,
    private router: Router,
    private alertController: AlertController,
    private customerService: CustomerService,
    private signalRService: SignalRService,
    private storeService: StoresService,
    private platform: Platform
  ) {
    this.user = this.sessionService.getUser();
    this.store = this.sessionService.getStore();
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.generateWeekDays();
    this.loadSchedulesForDate();
  }

  ngAfterViewInit() {
    this.loadSchedulesForDate();
    this.updateConnectedDropLists();

    this.slotLists.changes.subscribe(() => {
      this.updateConnectedDropLists();
    });
  }

  generateWeekDays() {
    this.weekDays = [];
    const today = new Date();
    const baseDate = new Date(this.selectedDate);

    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());

    for (let i = 0; i < 7; i++) {
      let d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);

      const isToday = d.toDateString() === today.toDateString();
      const isSelected = d.toDateString() === this.selectedDate.toDateString();

      this.weekDays.push({
        dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase(),
        dayNumber: d.getDate(),
        date: new Date(d),
        isSelected: isSelected,
        isToday: isToday
      });
    }
  }

  selectDate(day: any) {
    this.selectedDate = day.date;
    this.generateWeekDays();
    this.loadSchedulesForDate();
  }

  startService(customer: any) {
    this.service.startCustomerService(customer.id, this.user?.id || 0).subscribe({
      next: () => {
        this.toastController.show(`Atendimento de ${customer.name} iniciado.`, 'success');
        customer.status = 'inservice';
        this.recalculateSlots();
      },
      error: () => {
        this.toastController.show('Erro ao iniciar atendimento', 'danger');
      }
    });
  }

  finishCustomerService(customer: any) {
    this.service.finishCustomerService(customer.id).subscribe({
      next: () => {
        this.toastController.show('Atendimento finalizado com sucesso', 'success');
        customer.status = 'done';
        this.applyFilters();
      },
      error: (err) => {
        this.toastController.show('Erro ao finalizar atendimento', 'danger');
      }
    });
  }

  async onDragMoved(event: CdkDragMove<any>) {
    const scrollElement = await this.content.getScrollElement();
    const pointerY = event.pointerPosition.y;
    const screenHeight = window.innerHeight;
    const edgeThreshold = 120;
    const scrollSpeed = 35;

    if (pointerY > screenHeight - edgeThreshold) {
      scrollElement.scrollTop += scrollSpeed;
    }

    if (pointerY < edgeThreshold) {
      scrollElement.scrollTop -= scrollSpeed;
    }
  }

  canDrag(customer: any): boolean {
    return customer.status === 'confirmed';
  }

  reopenService(customer: any) {
    this.service.reopenCustomerService(customer.id).subscribe({
      next: () => {
        this.toastController.show(`Atendimento de ${customer.name} reaberto.`, 'primary');
        customer.status = 'pending';
        this.recalculateSlots();
      },
      error: () => {
        this.toastController.show('Erro ao reabrir atendimento', 'danger');
      }
    });
  }

  isToday(): boolean {
    const today = new Date();
    return this.selectedDate.toDateString() === today.toDateString();
  }

  get formattedSelectedDate(): string {
    const dayOfWeek = this.selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    const day = this.selectedDate.getDate();
    const month = this.selectedDate.toLocaleDateString('pt-BR', { month: 'short' });

    let formatted = `${dayOfWeek}, ${day} De ${month}`;
    formatted = formatted.replace('.', '');
    formatted = formatted.replace(/\b\w/g, (char) => char.toUpperCase());

    return formatted;
  }

  prevDay() {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    this.selectedDate = newDate;
    this.generateWeekDays();
    this.loadSchedulesForDate();
  }

  nextDay() {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    this.selectedDate = newDate;
    this.generateWeekDays();
    this.loadSchedulesForDate();
  }

  onDateChange(event: any) {
    const value = event.detail.value;
    const [year, month, day] = value.split('T')[0].split('-').map(Number);
    this.selectedDate = new Date(year, month - 1, day);

    this.generateWeekDays();
    this.loadSchedulesForDate();

    if (this.datetimeModal) {
      this.datetimeModal.dismiss();
    }
  }

  private updateConnectedDropLists() {
    setTimeout(() => {
      if (this.slotLists) {
        this.allDropListIds = this.slotLists.map(list => list.id).filter(id => id);
      }
    }, 100);
  }

  async handleRefresh(event: any) {
    try {
      await this.loadSchedulesForDate();
    } finally {
      event.target.complete();
    }
  }

  public loadSchedulesForDate() {
    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedDate.getDate()).padStart(2, '0');

    const date = `${year}-${month}-${day}`;

    this.service.getOwnerAgendaForDate(this.store.id, this.user.id, date).subscribe({
      next: (response) => {
        const data = response.data;
        if (!data || !data.slots) {
          this.originalSlotsTemplate = this.generateDefaultTimeSlots();
          this.appointments = [];
          this.recalculateSlots();
          return;
        }

        this.slotDuration = data?.slotDuration ?? 30;
        this.scheduleId = data?.scheduleId ?? 0;

        const apiSlots = (data.slots || []).map((s: any) => ({
          time: s.time?.substring(0, 5)
        }));

        const customerSlots = (data.customers || [])
          .map((c: any) => ({
            time: c.customerSelectedSlots?.slotStart?.substring(0, 5)
          }))
          .filter((s: any) => s.time);

        const mergedSlots = [...apiSlots, ...customerSlots];

        const uniqueSlots = mergedSlots.filter(
          (slot, index, self) =>
            index === self.findIndex(s => s.time === slot.time)
        );

        uniqueSlots.sort((a, b) => a.time.localeCompare(b.time));

        this.originalSlotsTemplate = uniqueSlots;

        this.appointments = (data.customers || []).map((customer: CustomerModel) => ({
          id: customer.id,
          name: customer.name,
          avatar: customer.imageUrl || null,
          status: this.mapStatus(customer.status ?? 0),
          servicesDescrip: (customer.services || []).map((s: any) => s.name),
          services: customer.services,
          slotStart: customer.customerSelectedSlots?.slotStart?.substring(0, 5),
          slotEnd: customer.customerSelectedSlots?.slotEnd?.substring(0, 5),
          isTransfered: customer.isTransfered || false,
          paymentMethodId: customer.paymentMethodId,
          notes: customer.notes
        }));

        this.recalculateSlots();
        this.updateFilterCounts();
        this.applyFilters();
      },
      error: (err) => {
        console.error('Erro ao carregar agendamentos:', err);
        this.originalSlotsTemplate = this.generateDefaultTimeSlots();
        this.appointments = [];
        this.recalculateSlots();
      }
    });
  }

  private generateDefaultTimeSlots(): { time: string }[] {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push({ time: `${hour.toString().padStart(2, '0')}:00` });
      if (hour !== 20) {
        slots.push({ time: `${hour.toString().padStart(2, '0')}:30` });
      }
    }
    return slots;
  }

  getConsolidatedStats() {
    const appointments = this.getAllCustomers();
    return {
      total: appointments.length,
      pending: appointments.filter((a: any) => a.status === 'pending').length,
      confirmed: appointments.filter((a: any) => a.status === 'confirmed').length,
      completed: appointments.filter((a: any) => a.status === 'done').length
    };
  }

  getAllCustomers() {
    return this.appointments || [];
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'primary';
      case 'inservice':
        return 'tertiary';
      case 'done':
      case 'completed':
        return 'success';
      default:
        return 'medium';
    }
  }

  getMainButtonIcon(status: string): string {
    switch (status) {
      case 'pending':
        return 'time-outline';

      case 'confirmed':
        return 'checkmark-circle-outline';

      case 'inservice':
        return 'play-circle-outline';

      case 'done':
        return 'checkmark-done-circle-outline';

      default:
        return 'ellipse-outline';
    }
  }

  showPrice(value?: number | null): string {
    if (!this.canShowPaymentDetails)
      return '••••';

    if (value == null || isNaN(value))
      return '-';

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  canEditAppointment(customer: any): boolean {
    return ['pending', 'confirmed'].includes(customer.status);
  }

  get canShowPaymentDetails(): boolean {
    if (!this.store?.hideAmountsWhenTransferringCustomers)
      return true;

    if (!this.selectedCustomer?.isTransfered) {
      return true;
    }

    return this.store.ownerId === this.user.id;
  }

  getStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'waiting': 'Aguardando',
      'pending': 'Pendente',
      'confirmed': 'Confirmado',
      'inservice': 'Em Atendimento',
      'done': 'Realizado',
      'absent': 'Ausente',
      'cancelled': 'Cancelado'
    };
    return textMap[status] || status;
  }

  openServicesSummary(customer: any) {
    this.selectedCustomer = customer;
    this.modalMode = 'summary';
    this.isModalOpen = true;
  }

  async beginCustomerTransfer(customer: any) {
    this.cancelLongPress();

    await this.loadProfessionals();

    const modal = await this.modalController.create({
      component: TransferCustomerModalComponent,
      componentProps: {
        professionals: this.professionals.filter(
          x => Number(x.id) !== Number(this.user.id))
      }
    });

    modal.onDidDismiss().then(result => {
      if (result.data?.scheduleId || result.data?.queueId) {
        this.executeTransfer(customer, result.data.scheduleId, result.data.queueId);
      }
    });

    await modal.present();
  }

  private executeTransfer(customer: any, destinationScheduleId: number, destinationQueueId: number) {
    const payload = {
      customerId: customer.id,
      currentSchedule: this.scheduleId,
      destinationScheduleId: destinationScheduleId,
      destinationQueueId: destinationQueueId
    };

    this.service.transferCustomer(payload).subscribe({
      next: () => {
        this.toastController.show('Cliente transferido com sucesso', 'success');
        this.removeAppointment(customer);
        this.loadSchedulesForDate();
      },
      error: (response) => {
        console.error('Erro ao transferir cliente:', response);
        this.toastController.show(response?.error?.data || 'Erro ao transferir cliente', 'danger');
      }
    });
  }

  removeAppointment(customer: any) {
    this.appointments = this.appointments.filter(a => a.id !== customer.id);
    this.recalculateSlots();
  }


  filterAppointments(event: any) {
    this.searchTerm = (event?.detail?.value || '').trim().toLowerCase();
    this.applyFilters();
  }

  private mapStatus(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'waiting',
      1: 'removed',
      2: 'inservice',
      3: 'done',
      4: 'absent',
      5: 'cancelled',
      6: 'pending',
      7: 'rejected',
      8: 'pending',
      9: 'confirmed',
      10: 'scheduled'
    };
    return statusMap[status] || 'pending';
  }

  setFilter(filterType: string) {
    this.selectedFilter = filterType;

    this.statusFilters.forEach(f => f.selected = false);

    if (filterType !== 'todos') {
      const filter = this.statusFilters.find(f => f.value === filterType);

      if (filter) {
        filter.selected = true;
      }
    }

    this.applyFilters();
  }

  isFilterSelected(filter: string): boolean {
    return this.selectedFilter === filter;
  }

  applyFilters() {
    if (!this.selectedTimeSlots || this.selectedTimeSlots.length === 0) {
      this.filteredTimeSlots = [];
      return;
    }

    const search = this.searchTerm.toLowerCase();
    const activeStatus = this.statusFilters.find(f => f.selected)?.value;

    this.filteredTimeSlots = this.selectedTimeSlots
      .map(slot => {
        let filteredCustomers = slot.customers || [];

        if (activeStatus) {
          filteredCustomers = filteredCustomers.filter((c: any) => c.status === activeStatus);
        }

        if (search) {
          filteredCustomers = filteredCustomers.filter((c: any) =>
            c.name?.toLowerCase().includes(search) ||
            c.services?.some((service: string) => service.toLowerCase().includes(search))
          );
        }

        return {
          ...slot,
          time: slot.time,
          customers: filteredCustomers
        };
      })
      .filter(slot => slot.customers.length > 0);

    this.updateConnectedDropLists();
  }

  recalculateSlots() {
    this.selectedTimeSlots = this.originalSlotsTemplate.map(slot => ({
      time: slot.time,
      customers: [] as any[]
    }));

    this.appointments.forEach(appointment => {
      if (appointment.slotStart) {
        const slot = this.selectedTimeSlots.find(s => s.time === appointment.slotStart);
        if (slot) {
          slot.customers.push(appointment);
        }
      }
    });

    this.applyFilters();
    this.updateConnectedDropLists();
  }

  private updateFilterCounts() {
    this.statusFilters.forEach(filter => filter.count = 0);
    this.appointments.forEach(appointment => {
      const filter = this.statusFilters.find(f => f.value === appointment.status);
      if (filter) filter.count++;
    });
  }

  private loadProfessionals(): Promise<void> {
    return new Promise((resolve) => {
      this.storeService.loadProfessionals(Number(this.store.id)).subscribe({
        next: (response: any) => {
          if (response.valid && response.data) {
            this.professionals = Array.isArray(response.data)
              ? response.data.map((prof: any) => ({
                id: prof.id.toString(),
                nome: `${prof.name} ${prof.lastName}`,
                scheduleId: prof.scheduleId,
                useAgenda: prof.useAgenda,
                queueId: prof.queueId
              }))
              : [];
          }
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  startCustomerService(customer: any) {
    this.startService(customer);
  }

  reopenCustomerService(customer: any) {
    this.reopenService(customer);
  }

  getMainButtonText(customer: any): string {
    switch (customer.status) {
      case 'confirmed': return 'Iniciar';
      case 'inservice': return 'Finalizar';
      default: return 'Detalhes';
    }
  }

  async openCustomerDetails(customer: any) {
    const modal = await this.modalController.create({
      component: CustomerDetailModalComponent,
      componentProps: {
        customer: customer
      },
      cssClass: 'customer-detail-modal',
      backdropDismiss: true,
      showBackdrop: true
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.action === 'delete') {
      this.loadSchedulesForDate();
    }
  }

  async cancelAppointment(customer: any) {
    const alert = await this.alertController.create({
      header: 'Cancelar Agendamento',
      message: `Deseja realmente cancelar o agendamento de ${customer.name}?`,
      buttons: [
        {
          text: 'Não',
          role: 'cancel'
        },
        {
          text: 'Sim',
          handler: () => {
            this.service.cancelAppointment(customer.id).subscribe({
              next: () => {
                this.toastController.show('Agendamento cancelado com sucesso!', 'success');
                customer.status = 'cancelled';
                this.recalculateSlots();
              },
              error: () => {
                this.toastController.show('Erro ao cancelar agendamento', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async handleMainAction(customer: any) {
    if (customer.status !== 'confirmed' && customer.status !== 'inservice') {
      this.openCustomerDetails(customer);
      return;
    }

    const confirmed = await this.confirmMainAction(customer);

    if (!confirmed)
      return;

    if (customer.status === 'confirmed') {
      this.startCustomerService(customer);

    } else if (customer.status === 'inservice') {
      this.finishCustomerService(customer);
    }
  }

  cancelLongPress() {
    this.clearLongPressTimer();
    this.isLongPressing = false;
    this.customerBeingLongPressed = null;
  }

  addAppointment(slot: any) {
    this.cancelLongPress();
    this.preSelectedSlot = slot;
    this.openAddCustomerModal();
  }

  private clearLongPressTimer() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  async openAddCustomerModal() {
    const modal = await this.modalController.create({
      component: CustomerTypeModalComponent,
      cssClass: 'customer-type-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.handleCustomerTypeSelection(result.data);
      }
    });

    await modal.present();
  }

  handleCustomerTypeSelection(type: 'app' | 'walkin') {
    if (type === 'app') {
      this.openCpfSearch();
    } else {
      this.openWalkInForm();
    }
  }

  async openCpfSearch() {
    const modal = await this.modalController.create({
      component: CpfSearchModalComponent
    });

    this.sessionService.setGenericKey(
      {
        preSelectedSlot: this.preSelectedSlot,
        selectedDate: this.selectedDate
      },
      'customerSelection'
    );

    modal.onDidDismiss().then((result) => {
      if (result.data?.customer) {
        this.navigateToServiceSelection(result.data.customer);
      }
    });

    await modal.present();
  }

  navigateToServiceSelection(customer: any) {
    this.router.navigate(['/select-services'], {
      state: {
        customer: customer,
        selectedDate: this.selectedDate,
        preSelectedSlot: this.preSelectedSlot,
        scheduleId: this.scheduleId,
        source: 'schedule',
        looseCustomer: true,
        looseCustomerName: customer.name
      }
    });

    this.preSelectedSlot = null;
  }

  async openWalkInForm() {
    const modal = await this.modalController.create({
      component: WalkInCustomerModalComponent,
      componentProps: {
        selectedDate: this.selectedDate
      }
    });

    this.sessionService.setGenericKey(
      {
        preSelectedSlot: this.preSelectedSlot,
        selectedDate: this.selectedDate
      },
      'customerSelection'
    );

    modal.onDidDismiss().then((result) => {
      if (result.data?.customerData) {
        this.createWalkInCustomer(result.data.customerData);
      }
    });

    await modal.present();
  }

  createWalkInCustomer(customerData: any) {
    const walkInCustomer = {
      id: 'walkin_' + Date.now(),
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email,
      isWalkIn: true,
      useAgenda: true,
      scheduleId: customerData.scheduleId,
      avatar: 'assets/walkin-avatar.png',
      looseCustomer: true
    };

    this.navigateToServiceSelection(walkInCustomer);
  }

  onDragStarted() {
    this.isDragging = true;
    document.body.classList.add('dragging-active');
  }

  onDragEnded() {
    this.isDragging = false;
    document.body.classList.remove('dragging-active');
  }

  async onDrop(event: CdkDragDrop<any[]>, targetSlot: any) {
    if (targetSlot.disabled) {
      this.toastController.show(`Horário ${targetSlot.time} não disponível.`, 'warning');
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const movingCustomer = event.previousContainer.data[event.previousIndex];

    if (!movingCustomer)
      return;

    if (movingCustomer.status !== 'confirmed') {
      this.toastController.show('Somente agendamentos confirmados podem ser movidos.', 'warning');
      return;
    }

    let targetCustomer = targetSlot.customers?.[0] || null;

    if (!targetCustomer && targetSlot.time) {
      targetCustomer = this.appointments.find(c => c.slotStart === targetSlot.time);
    }

    if (targetCustomer && targetCustomer.status !== 'confirmed') {
      this.toastController.show(
        'Não é possível trocar horário do cliente nesse status.',
        'warning'
      );
      return;
    }

    const movingDuration = this.getCustomerDuration(movingCustomer);
    const targetDuration = targetCustomer ? this.getCustomerDuration(targetCustomer) : 0;
    const willExceed = this.willExceedPlannedTime(
      targetSlot.time,
      movingDuration,
      targetDuration
    );

    if (willExceed && targetCustomer) {
      const confirmed = await this.confirmTimeExceedSwap(
        movingCustomer,
        targetCustomer,
        movingDuration,
        targetDuration
      );

      if (!confirmed)
        return;
    }

    this.performSwap(movingCustomer, targetCustomer, targetSlot);
  }

  async confirmMainAction(customer: any): Promise<boolean> {
    let header = '';
    let message = '';

    switch (customer.status) {
      case 'confirmed':
        header = 'Iniciar Atendimento';
        message = `Deseja iniciar o atendimento de ${customer.name}?`;
        break;

      case 'done':
        header = 'Reabrir Atendimento';
        message = `Deseja reabrir o atendimento de ${customer.name}?`;
        break;

      case 'pending':
        header = 'Confirmar Atendimento';
        message = `Deseja confirmar o atendimento de ${customer.name}?`;
        break;

      case 'inservice':
        header = 'Finalizar Atendimento';
        message = `Deseja finalizar o atendimento de ${customer.name}?`;
        break;

      default:
        return true;
    }

    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          role: 'confirm'
        }
      ]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();

    return role === 'confirm';
  }

  private getCustomerDuration(customer: any): number {
    if (!customer)
      return this.slotDuration;

    return customer.durationMinutes ||
      (customer.slotStart && customer.slotEnd
        ? this.toMinutes(customer.slotEnd) - this.toMinutes(customer.slotStart)
        : this.slotDuration);
  }

  private willExceedPlannedTime(newTime: string, movingDur: number, targetDur: number): boolean {
    const maxAllowedPerSlot = this.slotDuration * 2;
    return movingDur > maxAllowedPerSlot || (targetDur > 0 && targetDur > maxAllowedPerSlot);
  }

  private async confirmTimeExceedSwap(moving: any, target: any, movingDur: number, targetDur: number): Promise<boolean> {
    const alert = await this.alertController.create({
      header: '⚠️ Tempo pode ultrapassar',
      message: `A troca de ${moving.name} (${movingDur} min) com ${target.name} (${targetDur} min) pode exceder o tempo planejado no slot. Deseja confirmar mesmo assim?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Sim, Confirmar Troca', role: 'confirm' }
      ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  private performSwap(movingCustomer: any, targetCustomer: any, targetSlot: any) {
    const oldTime = movingCustomer.slotStart;

    movingCustomer.slotStart = targetSlot.time;
    if (targetCustomer) {
      targetCustomer.slotStart = oldTime;
    }

    const movingAppt = this.appointments.find(a => a.id === movingCustomer.id);
    const targetAppt = targetCustomer ? this.appointments.find(a => a.id === targetCustomer.id) : null;

    if (movingAppt)
      movingAppt.slotStart = targetSlot.time;

    if (targetAppt)
      targetAppt.slotStart = oldTime;

    this.service.updateCustomerAgendaAsync(
      movingCustomer.id,
      targetSlot.time,
      targetCustomer?.id
    ).subscribe({
      next: () => {
        this.toastController.show('Troca realizada com sucesso!', 'success');
        this.recalculateSlots();
      },
      error: (err) => {
        console.error(err);
        this.toastController.show('Erro ao realizar a troca', 'danger');
        this.loadSchedulesForDate();
      }
    });
  }

  private toMinutes(time: string): number {
    const [h, m] = time.substring(0, 5).split(':').map(Number);
    return h * 60 + m;
  }

  isSlotPassed(slotTime: string): boolean {
    const now = new Date();
    const [hours, minutes] = slotTime.split(':').map(Number);
    const slotDate = new Date(this.selectedDate);
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate.getTime() < now.getTime();
  }

  async openEditAppointmentModal(customer: any) {
    const modal = await this.modalController.create({
      component: EditServiceComponent,
      componentProps: {
        customer: customer,
        services: customer.services,
        selectedDate: this.selectedDate
      },
      cssClass: 'edit-service-modal'
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data) {
      console.log(data);
    }
  }

  async editAppointment(customer: any) {
    this.cancelLongPress();

    const servicesMapped = customer.services
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

    if (!servicesMapped.length) {
      this.toastController.show(
        'Este atendimento não possui serviços configuráveis',
        'medium'
      );
      return;
    }

    const modal = await this.modalController.create({
      component: ServiceConfigModalComponent,
      componentProps: {
        customerId: customer.id,
        services: servicesMapped
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (!data)
      return;

    this.customerService
      .hasScheduleOverlapAsync(data)
      .subscribe({
        next: async (hasOverlap) => {

          if (hasOverlap) {
            const confirm = await this.confirmOverlap();

            if (!confirm) {
              return;
            }
          }

          this.saveAppointmentServices(customer, data);
        },
        error: () => {
          this.toastController.show(
            'Erro ao validar conflito de horário',
            'danger'
          );
        }
      });
  }

  private async confirmOverlap(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Conflito de horário',
        message:
          'Este atendimento vai se sobrepor a outro agendamento. Deseja continuar mesmo assim?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Continuar',
            role: 'confirm',
            handler: () => resolve(true)
          }
        ]
      });

      await alert.present();
    });
  }

  private calculateTotalSlots(slotStart: string, slotEnd: string, allSlots: any[]): number {
    const startIndex = allSlots.findIndex(s => s.time === slotStart);
    const endIndex = allSlots.findIndex(s => s.time === slotEnd);

    if (startIndex === -1 || endIndex === -1)
      return 1;

    return endIndex - startIndex;
  }

  recalcCustomer(customer: any) {
    const totalMinutes = customer.services.reduce(
      (sum: number, s: any) => sum + ((s.finalDuration || 0) * (s.quantity || 1)),
      0
    );

    const appt = this.appointments.find(a => a.id === customer.id);

    if (!appt)
      return;

    appt.durationMinutes = totalMinutes;
    appt.slotEnd = this.addMinutesToTime(appt.slotStart, totalMinutes);

    appt.totalSlots = this.calculateTotalSlots(
      appt.slotStart,
      appt.slotEnd,
      this.originalSlotsTemplate
    );

    customer.totalSlots = appt.totalSlots;
    this.recalculateSlots();
  }

  private addMinutesToTime(time: string, minutesToAdd: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutesToAdd;
    const hh = Math.floor(totalMinutes / 60) % 24;
    const mm = totalMinutes % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  }


  saveAppointmentServices(customer: any, servicesUpdate: any) {
    this.customerService
      .updatePriceAndTimeForVariableServiceAsync(servicesUpdate)
      .subscribe({
        next: () => {

          this.toastController.show('Serviços atualizados com sucesso', 'success');

          servicesUpdate.customerServices.forEach((updated: any) => {

            const original = customer.services.find(
              (s: any) => s.serviceId === updated.serviceId
            );

            if (original) {
              original.finalPrice = updated.price;
              original.finalDuration = updated.duration;
            }
          });

          this.recalcCustomer(customer);
          this.applyFilters();
        },
        error: () => {
          this.toastController.show('Erro ao atualizar serviços', 'danger');
        }
      });
  }
}