import { Component, OnInit, QueryList, ViewChild, ViewChildren, AfterViewInit } from "@angular/core";
import { ScheduleService } from "src/services/schedule.service";
import { CdkDragDrop, CdkDragMove, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { UserModel } from "src/models/user-model";
import { SessionService } from "src/services/session.service";
import { StoresService } from "src/services/stores.service";
import { StoreModel } from "src/models/store-model";
import { ToastService } from "src/services/toast.service";
import { Router } from "@angular/router";
import { AlertController, IonContent, ModalController, Platform } from "@ionic/angular";
import { CpfSearchModalComponent } from "./modals/cpf-search-modal/cpf-search-modal.component";
import { CustomerTypeModalComponent } from "./modals/customer-type-modal/customer-type-modal.component";
import { WalkInCustomerModalComponent } from "./modals/walk-in-customer-modal/walk-in-customer-modal.component";
import { TransferCustomerModalComponent } from "./modals/transfer-modal/transfer-customer-modal.component";
import { ServiceConfigModalComponent } from "src/shared/components/service-config-modal-component/service-config-modal.component";
import { CustomerService } from "src/services/customer.service";
import { SignalRService } from "src/services/seignalr.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-owner-schedule",
  templateUrl: "./owner-schedule.page.html",
  styleUrls: ["./owner-schedule.page.scss"],
})
export class OwnerSchedulePage implements OnInit, AfterViewInit {
  @ViewChildren('slotList', { read: CdkDropList }) slotLists!: QueryList<CdkDropList>;

  @ViewChild('content', { static: false }) content!: IonContent;

  private autoScrollThreshold = 120;
  private autoScrollSpeed = 15;

  selectedDate: Date = new Date();
  subtitleHidden = false;
  private lastScrollCheck = 0;

  selectedTimeSlots: any[] = [];
  allDropListIds: string[] = [];
  filteredTimeSlots: any[] = [];
  preSelectedSlot: any = null;
  professionals: any[] = [];

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

  statusFilters = [
    { value: 'waiting', label: 'Aguardando', selected: false, count: 0, color: 'medium' },
    { value: 'pending', label: 'Pendente', selected: false, count: 0, color: 'warning' },
    { value: 'confirmed', label: 'Confirmado', selected: false, count: 0, color: 'success' },
    { value: 'inservice', label: 'Em Atendimento', selected: false, count: 0, color: 'primary' },
    { value: 'done', label: 'Realizado', selected: false, count: 0, color: 'primary' },
    { value: 'absent', label: 'Ausente', selected: false, count: 0, color: 'danger' },
    { value: 'cancelled', label: 'Cancelado', selected: false, count: 0, color: 'danger' },
    { value: 'next', label: 'Próximo', selected: false, count: 0, color: 'secondary' },
    { value: 'rejected', label: 'Rejeitado', selected: false, count: 0, color: 'danger' },
    { value: 'scheduled', label: 'Agendado', selected: false, count: 0, color: 'tertiary' }
  ];

  serviceFilters: any[] = [];
  connectedDropLists: CdkDropList[] = [];

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
    this.loadSchedulesForDate();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateConnectedDropLists();
    });
  }

  ionViewWillEnter() {
    this.loadSchedulesForDate();
    this.initSignalRConnection();

    this.signalRSub = this.signalRService
      .onScheduleUpdated$()
      .subscribe(() => {
        this.loadSchedulesForDate();
      });
  }

  ionViewWillLeave() {
    this.signalRSub?.unsubscribe();
    this.clearLongPressTimer();
  }

  get canShowPaymentDetails(): boolean {
    if (!this.store?.hideAmountsWhenTransferringCustomers)
      return true;

    if (!this.selectedCustomer?.isTransfered) {
      return true;
    }

    return this.store.ownerId === this.user.id;
  }

  onContentScroll(ev: any) {
    const now = Date.now();
    if (now - this.lastScrollCheck < 30)
      return;

    this.lastScrollCheck = now;

    const scrollTop = ev?.detail?.scrollTop ?? 0;
    this.subtitleHidden = scrollTop > 5;
  }

  getAllSlotIds(): string[] {
    return this.slotLists ? this.slotLists.map(l => l.id) : [];
  }

  private updateConnectedDropLists() {
    if (this.slotLists) {
      this.connectedDropLists = this.slotLists.toArray();
    }
  }

  private async initSignalRConnection() {
    try {
      await this.signalRService.startScheduleConnection();

      var signalRGroup = this.store.id.toString();

      await this.signalRService.joinScheduleGroup(signalRGroup);

      this.signalRService.onUpdateSchedule(() => {
        this.loadSchedulesForDate();
        this.recalculateSlots();
      });

    } catch (error) {
      console.error('Erro SignalR (loja):', error);
      setTimeout(() => this.initSignalRConnection(), 5000);
    }
  }

  startLongPress(customer: any, event: Event) {
    if (!this.canDeleteCustomer(customer)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    
    this.clearLongPressTimer();
    this.customerBeingLongPressed = customer;
    
    if (this.platform.is('capacitor') && navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    this.longPressTimer = setTimeout(() => {
      this.confirmDeleteCustomer(customer);
      this.isLongPressing = false;
      this.customerBeingLongPressed = null;
    }, this.longPressThreshold);
    
    this.isLongPressing = true;
  }

  cancelLongPress() {
    this.clearLongPressTimer();
    this.isLongPressing = false;
    this.customerBeingLongPressed = null;
  }

  private clearLongPressTimer() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  canDeleteCustomer(customer: any): boolean {
    return customer.status !== 'done' && customer.status !== 'inservice';
  }

  async confirmDeleteCustomer(customer: any) {
    const alert = await this.alertController.create({
      header: 'Remover Atendimento',
      message: `Deseja realmente remover o atendimento de ${customer.name}?`,
      cssClass: 'delete-confirm-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-cancel',
          handler: () => {
            this.cancelLongPress();
          }
        },
        {
          text: 'Remover',
          cssClass: 'alert-delete',
          handler: () => {
            this.executeDeleteCustomer(customer);
          }
        }
      ]
    });

    await alert.present();
  }

  private executeDeleteCustomer(customer: any) {
    this.service.removeMissingCustomer(customer.id, "Removido pelo responsável pelo atendimento").subscribe({
      next: () => {
        this.toastController.show('Atendimento removido com sucesso!', 'success');
        this.removeAppointment(customer);
        
        if (this.platform.is('capacitor') && navigator.vibrate) {
          navigator.vibrate(50);
        }
      },
      error: (err) => {
        console.error('Erro ao remover atendimento:', err);
        this.toastController.show('Erro ao remover atendimento', 'danger');
        this.loadSchedulesForDate();
      }
    });
  }

  private loadSchedulesForDate() {
    const d = this.selectedDate;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    const date = `${year}-${month}-${day}`;

    this.service.getOwnerAgendaForDate(this.store.id, this.user.id, date).subscribe({
      next: (response) => {
        const data = response.data;
        this.slotDuration = data?.slotDuration ?? 30;
        this.scheduleId = data?.scheduleId ?? 0;

        if (!data) {
          this.toastController.show('Nenhum dado encontrado', 'warning');
          return;
        }

        this.originalSlotsTemplate = data.slots.map((s: any) => ({ time: s.time }));

        this.selectedTimeSlots = this.originalSlotsTemplate.map(s => ({
          time: s.time,
          id: s.time,
          available: true,
          customers: [] as any[]
        }));

        this.appointments = [];
        data.customers?.forEach((customer: any) => {
          const slotStartFull = customer.customerSelectedSlots?.slotStart;
          const slotEndFull = customer.customerSelectedSlots?.slotEnd;

          if (!slotStartFull || !slotEndFull)
            return;

          const slotStart = slotStartFull.substring(0, 5);
          const slotEnd = slotEndFull.substring(0, 5);
          const durationMinutes = this.toMinutes(slotEnd) - this.toMinutes(slotStart);

          const totalSlots = this.calculateTotalSlots(slotStartFull, slotEndFull, data.slots);

          this.appointments.push({
            id: customer.id,
            name: customer.name,
            avatar: customer.imageUrl || null,
            totalSlots,
            isTransfered: customer.isTransfered || false,
            slotStart,
            slotEnd,
            paymentMethodId: customer.paymentMethodId,
            durationMinutes,
            status: this.mapStatus(customer.status ?? 0),
            services: (customer.services || []).map((s: any) => ({
              name: s.name,
              slots: s.quantity || 1,
              finalPrice: s.finalPrice || 0,
              finalDuration: s.finalDuration || 0,
              variablePrice: s.variablePrice || false,
              variableTime: s.variableTime || false,
              quantity: s.quantity || 1,
              serviceId: s.serviceId,
              color: this.getRandomServiceColor()
            }))
          });
        });

        this.recalculateSlots();

        this.updateFilterCounts();
        this.applyFilters();

        setTimeout(() => {
          this.updateConnectedDropLists();
        });
      },
      error: (err) => {
        this.toastController.show('Erro ao carregar agendamentos do dia', 'danger');
      }
    });
  }

  openServicesSummary(customer: any) {
    this.cancelLongPress();
    this.selectedCustomer = customer;
    this.modalMode = 'summary';
    this.isModalOpen = true;
  }

  canDrag(customer: any): boolean {
    return customer.status !== 'cancelled' && customer.status !== 'inservice' && customer.status !== 'done';
  }

  isServiceDone(customer: any) {
    return customer.status !== 'done';
  }

  private toMinutes(time: string): number {
    const [h, m] = time.substring(0, 5).split(':').map(Number);
    return h * 60 + m;
  }

  private loadProfessionals(): Promise<void> {
    return new Promise((resolve, reject) => {
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
              : [{
                id: response.data.id.toString(),
                nome: response.data.name,
                scheduleId: response.data.scheduleId
              }];
          }

          resolve();
        },
        error: err => {
          console.error(err);
          reject(err);
        }
      });
    });
  }

  shareSchedule() {
    const url = `${window.location.origin}/select-services?professionalId=${this.user.id}&professionalName=${encodeURIComponent(this.user.name + ' ' + this.user.lastName)}&storeId=${this.store.id}&useAgenda=${this.user.useAgenda}
`;
    navigator.clipboard.writeText(url).then(() => {
      this.toastController.show('Link da agenda copiado para a área de transferência!', 'success');
    });
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

  private formatMinutes(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private addMinutesToTime(time: string, minutesToAdd: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutesToAdd;
    const hh = Math.floor(totalMinutes / 60) % 24;
    const mm = totalMinutes % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  }

  private calculateTotalSlots(slotStart: string, slotEnd: string, allSlots: any[]): number {
    const startIndex = allSlots.findIndex(s => s.time === slotStart);
    const endIndex = allSlots.findIndex(s => s.time === slotEnd);

    if (startIndex === -1 || endIndex === -1)
      return 1;

    return endIndex - startIndex;
  }

  onDrop(event: CdkDragDrop<any[]>, targetSlot: any) {
    if (targetSlot.disabled) {
      this.toastController.show(`Drop bloqueado: ${targetSlot.time} já passou.`, 'warning');
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(targetSlot.customers, event.previousIndex, event.currentIndex);
      return;
    }

    const movedCustomer = event.previousContainer.data[event.previousIndex];

    if (!movedCustomer)
      return;

    const appt = this.appointments.find(a => a.id === movedCustomer.id);
    const durationMinutesFromAppt = appt?.durationMinutes;

    const fallbackDuration =
      movedCustomer.durationMinutes ||
      (movedCustomer.slotStart && movedCustomer.slotEnd
        ? this.toMinutes(movedCustomer.slotEnd) - this.toMinutes(movedCustomer.slotStart)
        : null);

    const durationMinutes =
      durationMinutesFromAppt ??
      fallbackDuration ??
      ((movedCustomer.totalSlots || 1) * this.slotDuration);

    const targetTime = targetSlot.time;
    const targetIndex = this.computeStartIndexFromTime(targetTime);
    const computedEnd = this.addMinutesToTime(targetTime, durationMinutes);
    const neededSlots = this.calculateTotalSlots(targetTime, computedEnd, this.originalSlotsTemplate as any);

    const conflict = this.doesRangeConflict(targetIndex, neededSlots, movedCustomer.id);
    if (conflict) {
      this.toastController.show('Esse intervalo está ocupado por outro atendimento.', 'warning');
      return;
    }

    try {
      event.previousContainer.data.splice(event.previousIndex, 1);
    } catch { }

    if (!appt) {
      const newAppt = {
        id: movedCustomer.id,
        name: movedCustomer.name,
        avatar: movedCustomer.avatar || 'assets/default-avatar.png',
        services: movedCustomer.services || [],
        status: movedCustomer.status || 'pending',
        totalSlots: neededSlots,
        slotStart: targetTime,
        slotEnd: computedEnd,
        durationMinutes,
      };
      this.appointments.push(newAppt);
    } else {
      appt.slotStart = targetTime;
      appt.slotEnd = computedEnd;
      appt.durationMinutes = durationMinutes;
      appt.totalSlots = neededSlots;
    }

    this.service.updateCustomerAgendaAsync(movedCustomer.id, targetTime).subscribe({
      next: () => {
        this.toastController.show('Agenda atualizada com sucesso!', 'success');
        this.recalculateSlots();
      },
      error: (err) => {
        this.toastController.show('Falha ao atualizar o horário do cliente.', 'danger');
        this.loadSchedulesForDate();
      },
    });
  }

  isSlotPassed(slotTime: string): boolean {
    const now = new Date();
    const [hours, minutes] = slotTime.split(':').map(Number);
    const slotDate = new Date(this.selectedDate);
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate.getTime() < now.getTime();
  }

  private hasTimePassed(time: string): boolean {
    if (!this.isToday())
      return false;

    const now = new Date();
    const [h, m] = time.split(':').map(Number);
    const slotTime = new Date();
    slotTime.setHours(h, m, 0, 0);
    return slotTime.getTime() < now.getTime();
  }

  private computeStartIndexFromTime(time: string): number {
    const baseTimes = this.originalSlotsTemplate.map(s => s.time);
    const exact = baseTimes.indexOf(time);

    if (exact !== -1)
      return exact;

    const insertion = baseTimes.findIndex(t => this.toMinutes(t) > this.toMinutes(time));
    if (insertion !== -1)
      return insertion;

    return baseTimes.length - 1;
  }

  private doesRangeConflict(startIndex: number, slotsCount: number, exceptAppointmentId: any): boolean {
    const baseTimes = this.originalSlotsTemplate.map(s => s.time);

    const targetStartTime = baseTimes[startIndex];
    const targetEndTime =
      baseTimes[startIndex + slotsCount] ??
      this.addMinutes(targetStartTime, slotsCount * this.slotDuration);

    const targetStartMinutes = this.toMinutes(targetStartTime);
    const targetEndMinutes = this.toMinutes(targetEndTime);

    for (const other of this.appointments) {

      if (other.id === exceptAppointmentId)
        continue;

      if (!other.slotStart || !other.slotEnd)
        continue;

      const otherStartMinutes = this.toMinutes(other.slotStart);
      const otherEndMinutes = this.toMinutes(other.slotEnd);

      const hasConflict =
        targetStartMinutes < otherEndMinutes &&
        targetEndMinutes > otherStartMinutes;

      if (hasConflict) {
        return true;
      }
    }

    return false;
  }

  private addMinutes(time: string, minutesToAdd: number): string {
    const [hours, minutes] = time.split(':').map(Number);

    const totalMinutes = hours * 60 + minutes + minutesToAdd;

    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;

    return `${newHours.toString().padStart(2, '0')}:${newMinutes
      .toString()
      .padStart(2, '0')}`;
  }

  private recalculateSlots() {
    const slotDuration = this.slotDuration;

    const baseSlots: any[] = this.originalSlotsTemplate.map(s => ({
      time: s.time,
      id: s.time,
      available: true,
      customers: [] as any[],
      disabled: this.hasTimePassed(s.time)
    }));

    const ensureSlotExists = (time: string): number => {
      let idx = baseSlots.findIndex(s => s.time === time);
      if (idx !== -1)
        return idx;

      const tMinutes = this.toMinutes(time);
      idx = baseSlots.findIndex(s => this.toMinutes(s.time) > tMinutes);
      if (idx === -1) {
        baseSlots.push({ time, id: time, available: true, customers: [] as any[] });
        return baseSlots.length - 1;
      } else {
        baseSlots.splice(idx, 0, { time, id: time, available: true, customers: [] as any[] });
        return idx;
      }
    };

    const sortedAppts = this.appointments.slice().sort((a, b) => {
      if (!a.slotStart)
        return 1;
      if (!b.slotStart)
        return -1;
      return this.toMinutes(a.slotStart) - this.toMinutes(b.slotStart);
    });

    for (const appt of sortedAppts) {
      const slotStart = appt.slotStart;
      const slotEnd = appt.slotEnd;

      if (!slotStart || !slotEnd)
        continue;

      const startIndex = ensureSlotExists(slotStart);
      let effectiveEnd = slotEnd;
      if (!effectiveEnd && appt.durationMinutes) {
        effectiveEnd = this.addMinutesToTime(slotStart, appt.durationMinutes);
      }

      if (!effectiveEnd)
        continue;

      const totalSlots = this.calculateTotalSlots(slotStart, effectiveEnd, baseSlots);

      const mappedCustomer = {
        ...appt,
        totalSlots,
        status: appt.status || 'pending',
        services: appt.services || []
      };

      for (let i = startIndex; i < startIndex + totalSlots && i < baseSlots.length; i++) {
        if (!baseSlots[i].customers) baseSlots[i].customers = [];
        baseSlots[i].customers.push(mappedCustomer);
        baseSlots[i].available = false;
      }

      const lastSlotIndex = startIndex + totalSlots - 1;
      const lastSlot = baseSlots[lastSlotIndex];
      if (lastSlot) {
        const endTimeMinutes = this.toMinutes(effectiveEnd);
        const lastSlotEndMinutes = this.toMinutes(this.addMinutesToTime(lastSlot.time, slotDuration));
        if (endTimeMinutes < lastSlotEndMinutes) {
          const formattedEnd = this.formatMinutes(endTimeMinutes);
          const exists = baseSlots.some(s => s.time === formattedEnd);
          if (!exists) {
            baseSlots.splice(lastSlotIndex + 1, 0, {
              time: formattedEnd,
              id: formattedEnd,
              available: true,
              customers: [] as any[]
            });
          }
        }
      }
    }

    this.selectedTimeSlots = this.groupCustomerSlots(baseSlots);
    this.filteredTimeSlots = [...this.selectedTimeSlots];
    this.updateFilterCounts();
    this.applyFilters();

    setTimeout(() => {
      this.updateConnectedDropLists();
    });
  }

  private groupCustomerSlots(slots: any[]): any[] {
    const grouped: any[] = [];
    const seen = new Set<number | string>();

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot.customers || slot.customers.length === 0) {
        grouped.push(slot);
        continue;
      }

      for (const customer of slot.customers) {
        if (seen.has(customer.id))
          continue;

        let count = 1;
        for (let j = i + 1; j < slots.length; j++) {
          const next = slots[j];
          if (next.customers.some((c: any) => c.id === customer.id)) count++;
          else break;
        }

        const realSlotEnd = customer.slotEnd ? customer.slotEnd : this.addMinutesToTime(slot.time, count * this.slotDuration);

        grouped.push({
          ...slot,
          groupedCustomer: {
            ...customer,
            slotStart: slot.time,
            slotEnd: realSlotEnd,
            totalSlots: count
          }
        });

        seen.add(customer.id);
      }
    }

    return grouped;
  }

  applyFilters(): void {
    if (!this.selectedTimeSlots || this.selectedTimeSlots.length === 0) {
      this.filteredTimeSlots = [];
      return;
    }

    const hasStatusFilters = this.statusFilters.some(f => f.selected);
    const hasServiceFilters = this.serviceFilters.some(f => f.selected);
    const hasSearch = this.searchTerm.trim().length > 0;

    if (!hasStatusFilters && !hasServiceFilters && !hasSearch) {
      this.filteredTimeSlots = [...this.selectedTimeSlots];
      this.updateFilterCounts();
      return;
    }

    const activeStatus = this.statusFilters.filter(f => f.selected).map(f => f.value.toLowerCase());
    const activeServices = this.serviceFilters.filter(f => f.selected).map(f => f.name.toLowerCase());
    const term = this.searchTerm.toLowerCase();

    this.filteredTimeSlots = this.selectedTimeSlots.map(slot => {
      const filteredCustomers = (slot.customers || []).filter((customer: any) => {
        if (hasStatusFilters) {
          const statusMatch = activeStatus.includes((customer.status || '').toLowerCase());
          if (!statusMatch)
            return false;
        }

        if (hasServiceFilters) {
          const serviceMatch = (customer.services || []).some((s: any) =>
            activeServices.includes((s.name || '').toLowerCase())
          );
          if (!serviceMatch)
            return false;
        }

        if (hasSearch) {
          const nameMatch = (customer.name || '').toLowerCase().includes(term);
          const serviceMatch = (customer.services || []).some((s: any) =>
            (s.name || '').toLowerCase().includes(term)
          );
          if (!nameMatch && !serviceMatch)
            return false;
        }

        return true;
      });

      return { ...slot, customers: filteredCustomers };
    }).filter(slot => slot.customers.length > 0);

    this.updateFilterCounts();
    this.showFilters = false;

    setTimeout(() => {
      this.updateConnectedDropLists();
    });
  }

  getStatusFilterByValue(value: string): any {
    return this.statusFilters?.find(filter => filter.value === value);
  }

  updateFilterCounts() {
    this.statusFilters.forEach(filter => filter.count = 0);
    this.serviceFilters.forEach(filter => filter.count = 0);

    this.selectedTimeSlots.forEach(slot => {
      (slot.customers || []).forEach((customer: any) => {
        const statusFilter = this.statusFilters.find(f => f.value === customer.status);
        if (statusFilter) statusFilter.count++;

        (customer.services || []).forEach((service: any) => {
          const serviceFilter = this.serviceFilters.find(f => f.name === service.name);
          if (serviceFilter)
            serviceFilter.count++;
        });
      });
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  }

  getWeekdayName(date: Date): string {
    return date.toLocaleDateString("pt-BR", { weekday: "long" });
  }

  isToday(): boolean {
    const today = new Date();
    return this.selectedDate.toDateString() === today.toDateString();
  }

  changeView(event: any) {
    this.currentView = event.detail?.value || this.currentView;
  }

  filterAppointments(event: any) {
    const v = event?.detail?.value ?? event?.target?.value ?? this.searchQuery;
    this.searchQuery = v ?? '';
    this.searchTerm = (this.searchQuery || '').trim();
    this.applyFilters();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  toggleStatusFilter(status: any) {
    status.selected = !status.selected;
  }

  toggleServiceFilter(service: any) {
    service.selected = !service.selected;
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.searchTerm !== '' ||
      this.statusFilters.some(f => f.selected) ||
      this.serviceFilters.some(f => f.selected);
  }

  getActiveFilters(): any[] {
    const filters: any[] = [];
    if (this.searchTerm) filters.push({ key: 'search', label: `Busca: "${this.searchTerm}"`, color: 'medium' });
    this.statusFilters.filter(f => f.selected).forEach(f => filters.push({ key: f.value, label: `Status: ${f.label}`, color: f.color }));
    this.serviceFilters.filter(f => f.selected).forEach(f => filters.push({ key: f.name, label: `Serviço: ${f.name}`, color: 'tertiary' }));
    return filters;
  }

  getActiveFiltersCount(): number {
    const statusCount = this.statusFilters.filter(s => s.selected).length;
    const serviceCount = this.serviceFilters.filter(s => s.selected).length;
    const searchCount = this.searchTerm ? 1 : 0;
    return statusCount + serviceCount + searchCount;
  }

  removeFilter(key: string) {
    if (key === 'search') { this.searchTerm = ''; this.searchQuery = ''; }
    else {
      const statusFilter = this.statusFilters.find(f => f.value === key);
      if (statusFilter) statusFilter.selected = false;
      else {
        const serviceFilter = this.serviceFilters.find(f => f.name === key);
        if (serviceFilter) serviceFilter.selected = false;
      }
    }
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = ''; this.searchQuery = '';
    this.statusFilters.forEach(f => f.selected = false);
    this.serviceFilters.forEach(f => f.selected = false);
    this.applyFilters();
  }

  getConsolidatedStats() {
    const appointments = this.getAllCustomers();
    return {
      confirmed: appointments.filter((a: any) => a.status === 'confirmed').length,
      pending: appointments.filter((a: any) => a.status === 'pending').length,
      completed: appointments.filter((a: any) => a.status === 'done').length,
      total: appointments.length
    };
  }

  getAllCustomers() {
    return this.appointments.slice();
  }

  getFilteredCustomers() {
    return this.filteredTimeSlots.flatMap(slot => slot.customers || []);
  }

  getSlotTime(customer: any): string {
    const appt = this.appointments.find(a => a.id === customer.id);
    return appt ? appt.slotStart : '';
  }

  getEmptySlotsCount(): number {
    return this.selectedTimeSlots.filter(slot => !slot.customers || slot.customers.length === 0).length;
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'waiting': 'medium', 'pending': 'warning', 'confirmed': 'success', 'inservice': 'primary', 'done': 'primary',
      'absent': 'danger', 'cancelled': 'danger', 'next': 'secondary', 'rejected': 'danger', 'scheduled': 'tertiary'
    };
    return colorMap[status] || 'medium';
  }

  getStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'waiting': 'Aguardando', 'pending': 'Pendente', 'confirmed': 'Confirmado', 'inservice': 'Em Atendimento', 'done': 'Realizado',
      'absent': 'Ausente', 'cancelled': 'Cancelado', 'next': 'Próximo', 'rejected': 'Rejeitado', 'scheduled': 'Agendado'
    };

    return textMap[status] || status;
  }

  getActionIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'waiting': 'time', 'pending': 'time', 'confirmed': 'checkmark-circle', 'inservice': 'play-circle', 'done': 'checkmark-done',
      'absent': 'close-circle', 'cancelled': 'close-circle', 'next': 'play-forward', 'rejected': 'close-circle', 'scheduled': 'calendar'
    };
    return iconMap[status] || 'ellipsis-horizontal';
  }

  getServiceColor(colorName: string): string {
    const colorMap: { [key: string]: string } = {
      'primary': '#3880ff', 'secondary': '#3dc2ff', 'tertiary': '#5260ff', 'success': '#2dd36f', 'warning': '#ffc409', 'danger': '#eb445a'
    };
    return colorMap[colorName] || '#666';
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

  canEditAppointment(customer: any): boolean {
    return ['pending', 'confirmed'].includes(customer.status);
  }

  quickAction(customer: any, slot?: any) {
    switch (customer.status) {
      case 'pending'
        : customer.status = 'confirmed';
        break;
      case 'confirmed'
        : customer.status = 'inservice';
        break;
      case 'inservice'
        : customer.status = 'done';
        break;
      case 'done'
        : customer.status = 'confirmed';
        break;
    }
    this.applyFilters();
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

  startCustomerService(customer: any) {
    this.service.startCustomerService(customer.id, this.user?.id || 0).subscribe({
      next: () => {
        this.toastController.show('Atendimento iniciado com sucesso', 'success');
        customer.status = 'inservice';
        this.applyFilters();
      },
      error: (err) => {
        this.toastController.show('Erro ao iniciar atendimento', 'danger');
      }
    });
  }

  async confirmStartCustomerService(customer: any) {
    this.cancelLongPress(); 
    
    const alert = await this.alertController.create({
      header: 'Confirmar ação',
      message: `Deseja realmente alterar o atendimento de ${customer.name}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-cancel'
        },
        {
          text: 'Confirmar',
          cssClass: 'alert-confirm',
          handler: () => {
            if (customer.status === 'confirmed') {
              this.startCustomerService(customer);
            } else if (customer.status === 'inservice') {
              this.finishCustomerService(customer);
            }
          }
        }]
    });

    await alert.present();
  }

  removeAppointment(customer: any) {
    this.appointments = this.appointments.filter(a => a.id !== customer.id);
    this.recalculateSlots();
  }

  previousDay() {
    this.selectedDate = new Date(this.selectedDate.setDate(this.selectedDate.getDate() - 1));
    this.loadSchedulesForDate();
  }

  nextDay() {
    this.selectedDate = new Date(this.selectedDate.setDate(this.selectedDate.getDate() + 1));
    this.loadSchedulesForDate();
  }

  goToToday() {
    this.selectedDate = new Date();
    this.loadSchedulesForDate();
  }

  onDragStarted() {
    this.isDragging = true;
    this.cancelLongPress();

    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  }

  onDragEnded() {
    this.isDragging = false;
  }

  async handleRefresh(event: any) {
    try {
      await this.loadSchedulesForDate();
    } finally {
      event.target.complete();
    }
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

    return statusMap[status] || 'unknown';
  }

  private getRandomServiceColor(): string {
    const colors = ['primary', 'secondary', 'tertiary', 'success', 'warning'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  addAppointment(slot: any) {
    this.cancelLongPress(); 
    this.preSelectedSlot = slot;
    this.openAddCustomerModal();
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

  async onDragMoved(event: CdkDragMove<any>) {
    const scrollEl = await this.content.getScrollElement();
    const rect = scrollEl.getBoundingClientRect();

    const pointerY = event.pointerPosition.y;

    if (pointerY > rect.bottom - this.autoScrollThreshold) {
      scrollEl.scrollTop += this.autoScrollSpeed;
    }

    else if (pointerY < rect.top + this.autoScrollThreshold) {
      scrollEl.scrollTop -= this.autoScrollSpeed;
    }
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
}