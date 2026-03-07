import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

interface Customer {
  name: string;
  service: string;
  startTime: string;
  paymentMethod: string;
  amount: number;
}

interface Metrics {
  totalCustomers: number;
  totalRevenue: number;
  averageTime: number;
  customersTrend: number;
  revenueTrend: number;
  timeTrend: number;
}

interface ChartData {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
})
export class ReportsPage implements OnInit {
  @ViewChild('startDateInput') startDateInput!: ElementRef;
  @ViewChild('endDateInput') endDateInput!: ElementRef;
  @ViewChild('singleDateInput') singleDateInput!: ElementRef;

  loading = false;
  showDatePicker = false;
  dateRangeType: 'range' | 'single' = 'range';
  selectedPreset: 'today' | 'week' | 'month' | 'custom' = 'week';
  showCustomDatePicker = false;
  customPickerType: 'start' | 'end' | 'single' = 'start';

  // Dados para o picker
  days: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];
  years: number[] = [];

  selectedDay: number = new Date().getDate();
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();

  filters = {
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date(),
    singleDate: new Date()
  };

  openStartDatePicker = false;
  openEndDatePicker = false;
  openSingleDatePicker = false;

  metrics: Metrics = {
    totalCustomers: 0,
    totalRevenue: 0,
    averageTime: 0,
    customersTrend: 0,
    revenueTrend: 0,
    timeTrend: 0
  };

  customers: Customer[] = [];

  chartData: ChartData[] = [];

  constructor() {
    // Gerar anos (últimos 2 anos, atual e próximos 2)
    const currentYear = new Date().getFullYear();
    this.years = [
      currentYear - 2,
      currentYear - 1,
      currentYear,
      currentYear + 1,
      currentYear + 2
    ];
  }

  ngOnInit() {
    this.search();
  }

  // Métodos para abrir picker customizado
  openCustomStartPicker() {
    this.customPickerType = 'start';
    const date = this.filters.startDate;
    this.selectedDay = date.getDate();
    this.selectedMonth = date.getMonth() + 1;
    this.selectedYear = date.getFullYear();
    this.showCustomDatePicker = true;
  }

  openCustomEndPicker() {
    this.customPickerType = 'end';
    const date = this.filters.endDate;
    this.selectedDay = date.getDate();
    this.selectedMonth = date.getMonth() + 1;
    this.selectedYear = date.getFullYear();
    this.showCustomDatePicker = true;
  }

  openCustomSinglePicker() {
    this.customPickerType = 'single';
    const date = this.filters.singleDate;
    this.selectedDay = date.getDate();
    this.selectedMonth = date.getMonth() + 1;
    this.selectedYear = date.getFullYear();
    this.showCustomDatePicker = true;
  }

  // Método para confirmar data
  confirmCustomDate() {
    const selectedDate = new Date(this.selectedYear, this.selectedMonth - 1, this.selectedDay);

    switch (this.customPickerType) {
      case 'start':
        this.filters.startDate = selectedDate;
        break;
      case 'end':
        this.filters.endDate = selectedDate;
        break;
      case 'single':
        this.filters.singleDate = selectedDate;
        break;
    }

    this.showCustomDatePicker = false;
  }

  closeCustomPicker() {
    this.showCustomDatePicker = false;
  }

  selectDay(day: number) {
    this.selectedDay = day;
  }

  selectMonth(month: number) {
    this.selectedMonth = month;
  }

  selectYear(year: number) {
    this.selectedYear = year;
  }

  search() {
    this.loading = true;

    // Simulação de chamada API
    setTimeout(() => {
      // Gerar dados mockados baseados no período
      const daysDiff = this.getDaysDifference();

      // Métricas com tendências
      this.metrics = {
        totalCustomers: 12 + Math.floor(Math.random() * 10),
        totalRevenue: 480 + Math.floor(Math.random() * 200),
        averageTime: 25 + Math.floor(Math.random() * 10),
        customersTrend: Math.floor(Math.random() * 20) - 5,
        revenueTrend: Math.floor(Math.random() * 25) - 2,
        timeTrend: Math.floor(Math.random() * 15) - 7
      };

      // Clientes mockados
      this.customers = [
        {
          name: 'João Silva',
          service: 'Corte de cabelo',
          startTime: '09:00',
          paymentMethod: 'Pix',
          amount: 40
        },
        {
          name: 'Maria Souza',
          service: 'Barba',
          startTime: '10:00',
          paymentMethod: 'Cartão',
          amount: 30
        },
        {
          name: 'Pedro Santos',
          service: 'Corte + Barba',
          startTime: '11:30',
          paymentMethod: 'Dinheiro',
          amount: 60
        },
        {
          name: 'Ana Oliveira',
          service: 'Coloração',
          startTime: '14:00',
          paymentMethod: 'Pix',
          amount: 120
        },
        {
          name: 'Carlos Lima',
          service: 'Corte infantil',
          startTime: '15:30',
          paymentMethod: 'Cartão',
          amount: 35
        }
      ];

      // Dados do gráfico
      this.generateChartData(daysDiff);

      this.loading = false;
    }, 600);
  }

  getDaysDifference(): number {
    const diffTime = Math.abs(this.filters.endDate.getTime() - this.filters.startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  generateChartData(days: number) {
    const colors = ['#007aff', '#34c759', '#ff9500', '#ff2d55', '#5856d6'];
    const days_of_week = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    this.chartData = [];

    for (let i = 0; i < Math.min(days, 7); i++) {
      const date = new Date(this.filters.startDate);
      date.setDate(date.getDate() + i);

      const value = Math.floor(Math.random() * 15) + 3;
      const maxValue = 20;

      this.chartData.push({
        label: days_of_week[date.getDay()],
        value: value,
        percentage: (value / maxValue) * 100,
        color: colors[i % colors.length]
      });
    }
  }

  formatDateRange(): string {
    if (this.dateRangeType === 'range') {
      return `${this.formatDate(this.filters.startDate)} - ${this.formatDate(this.filters.endDate)}`;
    } else {
      return this.formatDate(this.filters.singleDate);
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  getChartPeriod(): string {
    if (this.dateRangeType === 'range') {
      return `${this.filters.startDate.toLocaleDateString('pt-BR')} - ${this.filters.endDate.toLocaleDateString('pt-BR')}`;
    } else {
      return this.filters.singleDate.toLocaleDateString('pt-BR');
    }
  }

  openEndDatePickerMethod() {
    if (this.endDateInput && this.endDateInput.nativeElement) {
      this.endDateInput.nativeElement.showPicker();
    }
  }

  openStartDatePickerMethod() {
    setTimeout(() => { // Pequeno delay para garantir que a variável foi atualizada
      if (this.startDateInput && this.startDateInput.nativeElement) {
        this.startDateInput.nativeElement.showPicker();
      }
    }, 10);
  }

  openSingleDatePickerMethod() {
    if (this.singleDateInput && this.singleDateInput.nativeElement) {
      this.singleDateInput.nativeElement.showPicker();
    }
  }

  openDatePicker() {
    this.showDatePicker = true;
  }

  closeDatePicker() {
    this.showDatePicker = false;
  }

  applyDateRange() {
    this.closeDatePicker();
    this.search();
  }

  setPreset(preset: 'today' | 'week' | 'month' | 'custom', event: Event) {
    event.stopPropagation();
    this.selectedPreset = preset;

    const today = new Date();

    switch (preset) {
      case 'today':
        this.dateRangeType = 'single';
        this.filters.singleDate = new Date(today);
        break;
      case 'week':
        this.dateRangeType = 'range';
        this.filters.endDate = new Date(today);
        this.filters.startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'month':
        this.dateRangeType = 'range';
        this.filters.endDate = new Date(today);
        this.filters.startDate = new Date(today.setDate(today.getDate() - 30));
        break;
      case 'custom':
        this.openDatePicker();
        break;
    }

    if (preset !== 'custom') {
      this.search();
    }
  }

  selectQuickRange(range: 'today' | 'yesterday' | 'week' | 'month') {
    const today = new Date();

    switch (range) {
      case 'today':
        this.dateRangeType = 'single';
        this.filters.singleDate = new Date();
        break;
      case 'yesterday':
        this.dateRangeType = 'single';
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        this.filters.singleDate = yesterday;
        break;
      case 'week':
        this.dateRangeType = 'range';
        this.filters.endDate = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        this.filters.startDate = weekAgo;
        break;
      case 'month':
        this.dateRangeType = 'range';
        this.filters.endDate = new Date();
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        this.filters.startDate = monthAgo;
        break;
    }

    this.closeDatePicker();
    this.search();
  }

  onStartDateChange(event: any) {
    if (event.target.value) {
      this.filters.startDate = new Date(event.target.value);
    }
  }

  onEndDateChange(event: any) {
    if (event.target.value) {
      this.filters.endDate = new Date(event.target.value);
    }
  }

  onSingleDateChange(event: any) {
    if (event.target.value) {
      this.filters.singleDate = new Date(event.target.value);
      this.dateRangeType = 'single';
    }
  }

  getPaymentIcon(method: string): string {
    switch (method.toLowerCase()) {
      case 'pix': return 'phone-portrait-outline';
      case 'cartão': return 'card-outline';
      case 'dinheiro': return 'cash-outline';
      default: return 'wallet-outline';
    }
  }

  getPaymentClass(method: string): string {
    return method.toLowerCase();
  }

  exportData() {
    console.log('Exportando dados...');
    // Implementar lógica de exportação
  }

  toggleFilters() {
    // Método mantido para compatibilidade
  }
}