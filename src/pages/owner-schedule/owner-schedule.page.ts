import { Component, OnInit } from "@angular/core";
import { ScheduleService } from "src/services/schedule.service";
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

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
  searching = false;
  showFilters: boolean = false;
  viewMode: 'grid' | 'list' = 'grid';
  filteredAppointments: any[] = [];

  statusFilters = [
    { value: 'confirmed', label: 'Confirmado', selected: true, count: 0, color: 'success' },
    { value: 'pending', label: 'Pendente', selected: true, count: 0, color: 'warning' },
    { value: 'completed', label: 'Realizado', selected: true, count: 0, color: 'primary' },
    { value: 'cancelled', label: 'Cancelado', selected: false, count: 0, color: 'danger' }
  ];

  serviceFilters: any[] = [];

  ngOnInit() {
    this.loadMockAgenda();
    this.updateFilterCounts();
    this.applyFilters();
  }

  loadMockAgenda() {
    this.selectedTimeSlots = [
      {
        id: 1,
        time: '09:00',
        customers: [
          {
            id: 1,
            name: 'João Silva',
            avatar: 'https://i.pravatar.cc/100?img=1',
            totalSlots: 2,
            status: 'confirmed',
            services: [
              { name: 'Corte de cabelo', slots: 1, color: 'primary' },
              { name: 'Barba', slots: 1, color: 'tertiary' },
            ],
          },
        ],
      },
      {
        id: 2,
        time: '10:00',
        customers: [
          {
            id: 2,
            name: 'Maria Souza',
            avatar: 'https://i.pravatar.cc/100?img=2',
            totalSlots: 1,
            status: 'pending',
            services: [{ name: 'Coloração', slots: 1, color: 'success' }],
          },
        ],
      },
      {
        id: 3,
        time: '11:00',
        customers: [
          {
            id: 3,
            name: 'Carlos Oliveira',
            avatar: 'https://i.pravatar.cc/100?img=3',
            totalSlots: 3,
            status: 'completed',
            services: [
              { name: 'Corte social', slots: 2, color: 'primary' },
              { name: 'Hidratação', slots: 1, color: 'secondary' },
            ],
          }
        ]
      },
      { id: 4, time: '12:00', customers: [] },
      { id: 5, time: '13:00', customers: [] },
    ];

    const allServices = this.selectedTimeSlots.flatMap(slot =>
      slot.customers.flatMap((customer: any) => customer.services)
    );

    this.serviceFilters = [...new Map(allServices.map(service =>
      [service.name, { ...service, selected: true, count: 0 }]
    )).values()];
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
      filter.count = this.selectedTimeSlots.reduce((total, slot) =>
        total + slot.customers.filter((c: any) => c.status === filter.value).length, 0
      );
    });

    this.serviceFilters.forEach(serviceFilter => {
      serviceFilter.count = this.selectedTimeSlots.reduce((total, slot) =>
        total + slot.customers.filter((c: any) =>
          c.services.some((s: any) => s.name === serviceFilter.name)
        ).length, 0
      );
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

  applyFilters() {
    this.updateFilterCounts();

    this.filteredTimeSlots = this.selectedTimeSlots.map(slot => ({
      ...slot,
      customers: slot.customers.filter((customer: any) =>
        this.passesStatusFilter(customer) &&
        this.passesServiceFilter(customer) &&
        this.passesSearchFilter(customer)
      )
    })).filter(slot =>
      slot.customers.length > 0 ||
      (slot.customers.length === 0 && this.showEmptySlots())
    );

    // Opcional: recolher os filtros após aplicar
    // this.showFilters = false;
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
    // Mostrar slots vazios apenas se não houver filtros ativos
    return this.searchTerm === '' &&
      this.statusFilters.every(f => f.selected) &&
      this.serviceFilters.every(f => f.selected);
  }

  hasActiveFilters(): boolean {
    return this.searchTerm !== '' ||
      !this.statusFilters.every(f => f.selected) ||
      !this.serviceFilters.every(f => f.selected);
  }

  getActiveFilters(): any[] {
    const filters = [];

    if (this.searchTerm) {
      filters.push({ key: 'search', label: `Busca: "${this.searchTerm}"`, color: 'medium' });
    }

    this.statusFilters
      .filter(f => !f.selected)
      .forEach(f => filters.push({ key: f.value, label: `Status: ${f.label}`, color: f.color }));

    this.serviceFilters
      .filter(f => !f.selected)
      .forEach(f => filters.push({ key: f.name, label: `Serviço: ${f.name}`, color: 'tertiary' }));

    return filters;
  }

  removeFilter(key: string) {
    if (key === 'search') {
      this.searchTerm = '';
    } else {
      const statusFilter = this.statusFilters.find(f => f.value === key);
      if (statusFilter) {
        statusFilter.selected = true;
      } else {
        const serviceFilter = this.serviceFilters.find(f => f.name === key);
        if (serviceFilter) serviceFilter.selected = true;
      }
    }
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilters.forEach(f => f.selected = true);
    this.serviceFilters.forEach(f => f.selected = true);
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

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      confirmed: 'success',
      pending: 'warning',
      completed: 'primary',
      cancelled: 'danger'
    };
    return colorMap[status] || 'medium';
  }

  getStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      confirmed: 'Confirmado',
      pending: 'Pendente',
      completed: 'Realizado',
      cancelled: 'Cancelado'
    };
    return textMap[status] || status;
  }

  getActionIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      confirmed: 'checkmark-circle',
      pending: 'time',
      completed: 'checkmark-done',
      cancelled: 'close-circle'
    };
    return iconMap[status] || 'ellipsis-horizontal';
  }

  quickAction(customer: any, slot?: any) {
    switch (customer.status) {
      case 'pending':
        customer.status = 'confirmed';
        break;
      case 'confirmed':
        customer.status = 'completed';
        break;
      case 'completed':
        customer.status = 'confirmed';
        break;
    }
    this.applyFilters();
  }

  addAppointment(slot: any) {
    // Mock - adicionar novo agendamento
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
    // Mock - editar agendamento
    console.log('Editando agendamento:', customer);
    // Aqui abriria um modal de edição
  }

  addNewAppointment() {
    // Mock - novo agendamento em slot vazio
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
    this.loadAgenda();
  }

  nextDay() {
    this.selectedDate = new Date(this.selectedDate.setDate(this.selectedDate.getDate() + 1));
    this.loadAgenda();
  }

  goToToday() {
    this.selectedDate = new Date();
    this.loadAgenda();
  }

  getConsolidatedStats() {
    const appointments = this.getAllCustomers(); 

    return {
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      pending: appointments.filter(a => a.status === 'pending').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      total: appointments.length
    };
  }

  loadAgenda() {
    // Mock - recarregar agenda para nova data
    this.loadMockAgenda();
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
    return statusCount + serviceCount;
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