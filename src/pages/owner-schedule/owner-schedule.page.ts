import { Component, OnInit } from "@angular/core";
import { ScheduleService } from "src/services/schedule.service";
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { UserModel } from "src/models/user-model";
import { SessionService } from "src/services/session.service";
import { StoreModel } from "src/models/store-model";
import { ToastService } from "src/services/toast.service";

@Component({
  selector: "app-owner-schedule",
  templateUrl: "./owner-schedule.page.html",
  styleUrls: ["./owner-schedule.page.scss"],
})
export class OwnerSchedulePage implements OnInit {
  selectedDate: Date = new Date();
  selectedTimeSlots: any[] = [];
  filteredTimeSlots: any[] = [];
  currentView: 'grid' | 'list' = 'grid';
  searchTerm: string = '';
  showFilterModal: boolean = false;
  trashHover = false;
  isDragging = false;
  searchQuery = '';
  isLoading = false;
  user!: UserModel;
  store!: StoreModel;
  searching = false;
  showFilters: boolean = false;
  viewMode: 'grid' | 'list' = 'grid';
  filteredAppointments: any[] = [];

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

  constructor(private service: ScheduleService,
    private sessionService: SessionService,
    private toastController: ToastService
  ) {
    this.user = this.sessionService.getUser();
    this.store = this.sessionService.getStore();
  }

  ngOnInit() {
    this.loadSchedulesForDate();
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
      const filteredCustomers = slot.customers.filter((customer: any) => {
        if (hasStatusFilters) {
          const statusMatch = activeStatus.includes(customer.status.toLowerCase());
          if (!statusMatch) return false;
        }

        if (hasServiceFilters) {
          const serviceMatch = customer.services.some((s: any) =>
            activeServices.includes(s.name.toLowerCase())
          );
          if (!serviceMatch) return false;
        }

        if (hasSearch) {
          const nameMatch = customer.name.toLowerCase().includes(term);
          const serviceMatch = customer.services.some((s: any) =>
            s.name.toLowerCase().includes(term)
          );
          if (!nameMatch && !serviceMatch) return false;
        }

        return true;
      });

      return { ...slot, customers: filteredCustomers };
    }).filter(slot => slot.customers.length > 0);

    this.updateFilterCounts();
    this.showFilters = false;
  }

  private loadSchedulesForDate() {
    this.isLoading = true;
    this.service.getOwnerAgendaForDate(this.store.id, this.user.id, this.selectedDate).subscribe({
      next: (response) => {
        const data = response.data;
        if (!data) {
          this.toastController.show('Nenhum dado encontrado', 'warning');
          this.isLoading = false;
          return;
        }

        this.selectedTimeSlots = data.slots.map(slot => ({
          time: slot.time,
          id: slot.time,
          available: slot.available,
          customers: []
        }));

        data.customers?.forEach(customer => {
          const slotStart = customer.customerSelectedSlots?.slotStart;
          const slotEnd = customer.customerSelectedSlots?.slotEnd;

          if (!slotStart || !slotEnd)
            return;

          const slotStartShort = slotStart.substring(0, 5);
          const slot = this.selectedTimeSlots.find(s => s.time === slotStartShort);

          if (!slot)
            return;

          const totalSlots = this.calculateTotalSlots(slotStart, slotEnd, data.slots);

          const mappedCustomer = {
            id: customer.id,
            name: customer.name,
            avatar: customer.imageUrl || 'assets/default-avatar.png',
            totalSlots,
            status: this.mapStatus(customer.status ?? 0),
            services: (customer.services || []).map(s => ({
              name: s.name,
              slots: s.quantity || 1,
              color: this.getRandomServiceColor()
            }))
          };

          slot.customers.push(mappedCustomer);

          const startIndex = this.selectedTimeSlots.findIndex(s => s.time === slotStartShort);
          for (let i = startIndex; i < startIndex + totalSlots && i < this.selectedTimeSlots.length; i++) {
            this.selectedTimeSlots[i].available = false;
          }
        });

        this.updateFilterCounts();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar agendamentos para o dia:', err);
        this.toastController.show('Erro ao carregar agendamentos do dia', 'danger');
        this.isLoading = false;
      }
    });
  }

  private calculateTotalSlots(slotStart: string, slotEnd: string, allSlots: any[]): number {
    if (!slotStart || !slotEnd || allSlots.length < 2) return 1;

    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const start = toMinutes(slotStart.substring(0, 5));
    const end = toMinutes(slotEnd.substring(0, 5));
    if (end <= start) return 1;

    const slotDurations: number[] = [];
    for (let i = 1; i < allSlots.length; i++) {
      const prev = toMinutes(allSlots[i - 1].time);
      const curr = toMinutes(allSlots[i].time);
      slotDurations.push(curr - prev);
    }

    const avgSlotDuration = slotDurations.length
      ? slotDurations.reduce((a, b) => a + b, 0) / slotDurations.length
      : 60;

    const totalDuration = end - start;
    const totalSlots = Math.ceil(totalDuration / avgSlotDuration);

    return totalSlots > 0 ? totalSlots : 1;
  }

  private mapStatus(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'waiting',
      1: 'removed',
      2: 'inservice',
      3: 'done',
      4: 'absent',
      5: 'cancelled',
      6: 'next',
      7: 'pending',
      8: 'rejected',
      9: 'confirmed'
    };
    return statusMap[status] || 'pending';
  }

  private getRandomServiceColor(): string {
    const colors = ['primary', 'secondary', 'tertiary', 'success', 'warning'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  filterAppointments(event: any) {
    this.searchTerm = event.detail.value.toLowerCase();
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
  }

  updateFilterCounts() {
    this.statusFilters.forEach(filter => {
      filter.count = 0;
    });

    this.serviceFilters.forEach(serviceFilter => {
      serviceFilter.count = 0;
    });

    this.selectedTimeSlots.forEach(slot => {
      slot.customers.forEach((customer: any) => {
        const statusFilter = this.statusFilters.find(f => f.value === customer.status);
        if (statusFilter) {
          statusFilter.count++;
        }

        customer.services.forEach((service: any) => {
          const serviceFilter = this.serviceFilters.find(f => f.name === service.name);
          if (serviceFilter) {
            serviceFilter.count++;
          }
        });
      });
    });
  }

  getWeekdayName(date: Date): string {
    return date.toLocaleDateString("pt-BR", { weekday: "long" });
  }

  getServiceColor(colorName: string): string {
    const colorMap: { [key: string]: string } = {
      'primary': '#3880ff',
      'secondary': '#3dc2ff',
      'tertiary': '#5260ff',
      'success': '#2dd36f',
      'warning': '#ffc409',
      'danger': '#eb445a'
    };
    return colorMap[colorName] || '#666';
  }

  passesStatusFilter(customer: any): boolean {
    const activeStatusFilters = this.statusFilters.filter(f => f.selected);
    return activeStatusFilters.some(filter => customer.status === filter.value);
  }

  passesServiceFilter(customer: any): boolean {
    const activeServiceFilters = this.serviceFilters.filter(f => f.selected);
    if (activeServiceFilters.length === 0) return true;

    return customer.services.some((service: any) =>
      activeServiceFilters.some(filter => filter.name === service.name)
    );
  }

  passesSearchFilter(customer: any): boolean {
    if (!this.searchTerm) return true;

    return customer.name.toLowerCase().includes(this.searchTerm) ||
      customer.services.some((s: any) =>
        s.name.toLowerCase().includes(this.searchTerm)
      );
  }

  showEmptySlots(): boolean {
    return this.searchTerm === '' &&
      this.statusFilters.every(f => !f.selected) &&
      this.serviceFilters.every(f => !f.selected);
  }

  hasActiveFilters(): boolean {
    return this.searchTerm !== '' ||
      this.statusFilters.some(f => f.selected) ||
      this.serviceFilters.some(f => f.selected);
  }

  getActiveFilters(): any[] {
    const filters = [];

    if (this.searchTerm) {
      filters.push({ key: 'search', label: `Busca: "${this.searchTerm}"`, color: 'medium' });
    }

    this.statusFilters
      .filter(f => f.selected)
      .forEach(f => filters.push({ key: f.value, label: `Status: ${f.label}`, color: f.color }));

    this.serviceFilters
      .filter(f => f.selected)
      .forEach(f => filters.push({ key: f.name, label: `Serviço: ${f.name}`, color: 'tertiary' }));

    return filters;
  }

  removeFilter(key: string) {
    if (key === 'search') {
      this.searchTerm = '';
      this.searchQuery = '';
    } else {
      const statusFilter = this.statusFilters.find(f => f.value === key);
      if (statusFilter) {
        statusFilter.selected = false;
      } else {
        const serviceFilter = this.serviceFilters.find(f => f.name === key);
        if (serviceFilter)
          serviceFilter.selected = false;
      }
    }
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.searchQuery = '';
    this.statusFilters.forEach(f => f.selected = false);
    this.serviceFilters.forEach(f => f.selected = false);
    this.applyFilters();
  }

  changeView(event: any) {
    this.currentView = event.detail.value;
  }

  getStats() {
    const allCustomers = this.getAllCustomers();
    return {
      confirmed: allCustomers.filter(c => c.status === 'confirmed').length,
      pending: allCustomers.filter(c => c.status === 'pending').length,
      completed: allCustomers.filter(c => c.status === 'completed').length,
      total: allCustomers.length
    };
  }

  getAllCustomers() {
    return this.selectedTimeSlots.flatMap(slot => slot.customers);
  }

  getFilteredCustomers() {
    return this.filteredTimeSlots.flatMap(slot => slot.customers);
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'waiting': 'medium',
      'pending': 'warning',
      'confirmed': 'success',
      'inservice': 'primary',
      'done': 'primary',
      'absent': 'danger',
      'cancelled': 'danger',
      'next': 'secondary',
      'rejected': 'danger',
      'scheduled': 'tertiary'
    };
    return colorMap[status] || 'medium';
  }

  getStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'waiting': 'Aguardando',
      'pending': 'Pendente',
      'confirmed': 'Confirmado',
      'inservice': 'Em Atendimento',
      'done': 'Realizado',
      'absent': 'Ausente',
      'cancelled': 'Cancelado',
      'next': 'Próximo',
      'rejected': 'Rejeitado',
      'scheduled': 'Agendado'
    };
    return textMap[status] || status;
  }

  getActionIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'waiting': 'time',
      'pending': 'time',
      'confirmed': 'checkmark-circle',
      'inservice': 'play-circle',
      'done': 'checkmark-done',
      'absent': 'close-circle',
      'cancelled': 'close-circle',
      'next': 'play-forward',
      'rejected': 'close-circle',
      'scheduled': 'calendar'
    };
    return iconMap[status] || 'ellipsis-horizontal';
  }

  quickAction(customer: any, slot?: any) {
    switch (customer.status) {
      case 'pending':
        customer.status = 'confirmed';
        break;
      case 'confirmed':
        customer.status = 'inservice';
        break;
      case 'inservice':
        customer.status = 'done';
        break;
      case 'done':
        customer.status = 'confirmed';
        break;
    }
    this.applyFilters();
  }

  addAppointment(slot: any) {
    const newCustomer = {
      id: Date.now(),
      name: 'Novo Cliente',
      avatar: 'https://i.pravatar.cc/100?img=6',
      totalSlots: 1,
      status: 'pending',
      time: slot.time,
      services: [{ name: 'Corte', slots: 1, color: 'primary' }]
    };

    slot.customers.push(newCustomer);
    this.applyFilters();
  }

  editAppointment(customer: any) {
    console.log('Editando agendamento:', customer);
    // Aqui abriria um modal de edição
  }

  addNewAppointment() {
    const emptySlot = this.selectedTimeSlots.find(slot => slot.customers.length === 0);
    if (emptySlot) {
      this.addAppointment(emptySlot);
    }
  }

  onDrop(event: CdkDragDrop<any[]>, targetSlot: any) {
    this.isDragging = false;

    if (event.previousContainer === event.container) {
      moveItemInArray(targetSlot.customers, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        targetSlot.customers,
        event.previousIndex,
        event.currentIndex
      );

      const movedCustomer = targetSlot.customers[event.currentIndex];
      movedCustomer.time = targetSlot.time;
    }
    this.applyFilters();
  }

  onTrashDrop(event: CdkDragDrop<any[]>) {
    const customer = event.previousContainer.data[event.previousIndex];
    event.previousContainer.data.splice(event.previousIndex, 1);
    this.trashHover = false;
    this.isDragging = false;
    this.applyFilters();
  }

  removeAppointment(customer: any, slot?: any) {
    if (slot) {
      slot.customers = slot.customers.filter((c: any) => c.id !== customer.id);
    } else {
      this.selectedTimeSlots.forEach(s => {
        s.customers = s.customers.filter((c: any) => c.id !== customer.id);
      });
    }
    this.applyFilters();
  }

  isToday(): boolean {
    const today = new Date();
    return this.selectedDate.toDateString() === today.toDateString();
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

  getConsolidatedStats() {
    const appointments = this.getAllCustomers();

    return {
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      pending: appointments.filter(a => a.status === 'pending').length,
      completed: appointments.filter(a => a.status === 'done').length,
      total: appointments.length
    };
  }

  loadAgenda() {
    this.applyFilters();
  }

  getSlotTime(customer: any): string {
    const slot = this.selectedTimeSlots.find(s =>
      s.customers.some((c: any) => c.id === customer.id)
    );
    return slot ? slot.time : '';
  }

  getEmptySlotsCount(): number {
    return this.selectedTimeSlots.filter(slot => slot.customers.length === 0).length;
  }

  getActiveFiltersCount(): number {
    const statusCount = this.statusFilters.filter(s => s.selected).length;
    const serviceCount = this.serviceFilters.filter(s => s.selected).length;
    const searchCount = this.searchTerm ? 1 : 0;
    return statusCount + serviceCount + searchCount;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  }

  onDragStarted() {
    this.isDragging = true;
  }

  onDragEnded() {
    this.isDragging = false;
    this.trashHover = false;
  }
}