import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { StoreModel } from 'src/models/store-model';
import { UserModel } from 'src/models/user-model';
import { ReportService } from 'src/services/report.service';
import { SessionService } from 'src/services/session.service';

interface Customer {
  name: string;
  service: string;
  startTime: string;
  date: string;
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

interface ReportRequest {
  storeId: number;
  employeeId: number;
  startDate: string;
  endDate: string;
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

  showDatePicker = false;
  showCustomDatePicker = false;
  store: StoreModel = {} as StoreModel;
  employee!: UserModel;

  dateRangeType: 'range' | 'single' = 'range';
  selectedPreset: 'today' | 'week' | 'month' | 'custom' = 'week';
  customPickerType: 'start' | 'end' | 'single' = 'start';

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

  dayColors = [
    '#ff3b30', // Dom
    '#007aff', // Seg
    '#34c759', // Ter
    '#ff9500', // Qua
    '#5856d6', // Qui
    '#ff2d55', // Sex
    '#5ac8fa'  // Sab
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
  report: any = null;
  busiestDay: any = null;
  topService: any = null;
  busiestPeriod: any = null;

  constructor(private sessionService: SessionService, private reportService: ReportService) {
    this.store = this.sessionService.getStore();
    this.employee = this.sessionService.getUser();

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

  openCustomStartPicker() {
    this.customPickerType = 'start';
    const date = this.filters.startDate;
    this.setPickerDate(date);
    this.showCustomDatePicker = true;
  }

  openCustomEndPicker() {
    this.customPickerType = 'end';
    const date = this.filters.endDate;
    this.setPickerDate(date);
    this.showCustomDatePicker = true;
  }

  openCustomSinglePicker() {
    this.customPickerType = 'single';
    const date = this.filters.singleDate;
    this.setPickerDate(date);
    this.showCustomDatePicker = true;
  }

  setPickerDate(date: Date) {
    this.selectedDay = date.getDate();
    this.selectedMonth = date.getMonth() + 1;
    this.selectedYear = date.getFullYear();
  }

  confirmCustomDate() {
    const selectedDate = new Date(
      this.selectedYear,
      this.selectedMonth - 1,
      this.selectedDay
    );

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

  buildWeekChart(apiDays: any[]) {
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const fullWeek: ChartData[] = [];
    const max = Math.max(...apiDays.map(d => d.count), 1);

    for (let i = 0; i < 7; i++) {
      const found = apiDays.find(d => d.dayOfWeek === i);
      const value = found ? found.count : 0;

      fullWeek.push({
        label: daysOfWeek[i],
        value: value,
        percentage: (value / max) * 100,
        color: this.dayColors[i]
      });
    }

    return fullWeek;
  }

  getMostBusyPeriod() {
    if (!this.report?.attendances?.length) 
      return null;

    const periods: any = {};

    this.report.attendances.forEach((a: { startTime: string }) => {
      const hour = Number(a.startTime.split(':')[0]);

      const start = Math.floor(hour / 2) * 2;
      const end = start + 2;
      const key = `${start}-${end}`;

      if (!periods[key]) {
        periods[key] = 0;
      }

      periods[key]++;
    });

    const busiest = Object.entries(periods).sort((a: any, b: any) => b[1] - a[1])[0];      

    if (!busiest) 
      return null;

    return {
      period: busiest[0],
      count: busiest[1]
    };
  }

  getTopService() {
    if (!this.report?.servicesSummary?.length)
      return null;

    return this.report.servicesSummary
      .reduce((prev: { revenue: number; }, current: { revenue: number; }) =>
        current.revenue > prev.revenue ? current : prev
      );
  }

  getMostBusyDay() {
    if (!this.report?.chartData?.byDayOfWeek?.length)
      return null;

    const busiest = this.report.chartData.byDayOfWeek
      .reduce((prev: { count: number; }, current: { count: number; }) =>
        current.count > prev.count ? current : prev
      );

    return {
      day: this.translateDay(busiest.dayOfWeek),
      count: busiest.count
    };
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
    const filter = this.buildRequestFilter();

    this.reportService
      .getMetricsReport(
        this.employee.id,
        filter
      )
      .subscribe({
        next: (res) => {

          if (!res.valid) {
            return;
          }

          const data = res.data;
          this.report = data;

          this.metrics.totalCustomers = data.metrics.totalCustomers;
          this.metrics.totalRevenue = data.metrics.totalRevenue;
          this.metrics.averageTime = data.metrics.averageTime;

          this.metrics.customersTrend = data.metrics.trends.customersTrend;
          this.metrics.revenueTrend = data.metrics.trends.revenueTrend;
          this.metrics.timeTrend = data.metrics.trends.timeTrend;

          this.chartData = this.buildWeekChart(
            data.chartData.byDayOfWeek
          );

          this.customers = data.attendances.map(a => ({
            name: a.customerName,
            service: a.service ?? 'Serviço',
            date: a.date,
            startTime: a.startTime,
            paymentMethod: a.paymentMethod,
            amount: a.amount
          }));

          this.busiestDay = this.getMostBusyDay();
          this.topService = this.getTopService();
          this.busiestPeriod = this.getMostBusyPeriod();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  getPeriodLabel(period: string | undefined) {
    switch (period) {
      case 'morning':
        return '08h – 12h';
      case 'afternoon':
        return '12h – 18h';
      case 'evening':
        return '18h+';
      default:
        return '-';
    }
  }

  translateDay(day: number): string {
    const map: any = {
      0: 'Dom',
      1: 'Seg',
      2: 'Ter',
      3: 'Qua',
      4: 'Qui',
      5: 'Sex',
      6: 'Sáb'
    };

    return map[day] ?? '';
  }

  buildRequestFilter(): ReportRequest {
    let startDate: Date;
    let endDate: Date;

    if (this.dateRangeType === 'single') {
      startDate = new Date(this.filters.singleDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(this.filters.singleDate);
      endDate.setHours(23, 59, 59, 999);

    } else {
      startDate = new Date(this.filters.startDate);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(this.filters.endDate);
      endDate.setHours(23, 59, 59, 999);
    }

    return {
      storeId: this.store.id,
      employeeId: this.employee.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }

  setPreset(preset: 'today' | 'week' | 'month' | 'custom', event: Event) {
    event.stopPropagation();
    this.selectedPreset = preset;

    switch (preset) {
      case 'today':
        this.dateRangeType = 'single';
        this.filters.singleDate = new Date();
        break;

      case 'week':
        this.dateRangeType = 'range';
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        this.filters.startDate = weekAgo;
        this.filters.endDate = new Date();
        break;

      case 'month':
        this.dateRangeType = 'range';
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        this.filters.startDate = monthAgo;
        this.filters.endDate = new Date();
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
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        this.filters.startDate = weekAgo;
        this.filters.endDate = new Date();
        break;

      case 'month':
        this.dateRangeType = 'range';
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        this.filters.startDate = monthAgo;
        this.filters.endDate = new Date();
        break;
    }

    this.closeDatePicker();
    this.search();
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

  getDaysDifference(): number {
    if (this.dateRangeType === 'single') {
      return 1;
    }

    const diffTime = Math.abs(
      this.filters.endDate.getTime() - this.filters.startDate.getTime()
    );

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  generateChartData(days: number) {

    const dayColors = [
      '#ff3b30', // Dom
      '#007aff', // Seg
      '#34c759', // Ter
      '#ff9500', // Qua
      '#5856d6', // Qui
      '#ff2d55', // Sex
      '#5ac8fa'  // Sab
    ];

    const days_of_week = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    this.chartData = [];
    const maxValue = 20;

    for (let i = 0; i < Math.min(days, 7); i++) {
      const date = new Date(this.filters.startDate);
      date.setDate(date.getDate() + i);
      const value = Math.floor(Math.random() * 15) + 3;
      const dayIndex = date.getDay();

      this.chartData.push({
        label: days_of_week[dayIndex],
        value: value,
        percentage: (value / maxValue) * 100,
        color: dayColors[dayIndex]
      });
    }
  }

  private businessIcons: { [key: number]: string } = {
    1: 'cut-outline',
    2: 'color-palette-outline',
    3: 'construct-outline',
    4: 'fast-food-outline',
    5: 'medkit-outline',
    6: 'grid-outline',
    7: 'hand-left-outline',
    8: 'ice-cream-outline',
    9: 'sparkles-outline',
    10: 'brush-outline'
  };

  getBusinessIcon(): string {
    return this.businessIcons[this.store.categoryId] || 'pricetag-outline';
  }

  formatDateRange(): string {
    if (this.dateRangeType === 'range') {
      return `${this.formatDate(this.filters.startDate)} - ${this.formatDate(this.filters.endDate)}`;
    } else {
      return this.formatDate(this.filters.singleDate);
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  getChartPeriod(): string {
    if (this.dateRangeType === 'range') {
      return `${this.filters.startDate.toLocaleDateString('pt-BR')} - ${this.filters.endDate.toLocaleDateString('pt-BR')}`;
    }

    return this.filters.singleDate.toLocaleDateString('pt-BR');
  }

  getPaymentIcon(method: string): string {

    switch (method.toLowerCase()) {
      case 'pix':
        return 'phone-portrait-outline';
      case 'cartão':
        return 'card-outline';
      case 'dinheiro':
        return 'cash-outline';
      default:
        return 'wallet-outline';
    }
  }

  getPaymentClass(method: string): string {
    return method.toLowerCase();
  }

  exportData() {
    console.log('Exportando relatório...');
  }

  toggleFilters() {
    // mantido para compatibilidade
  }

  onEndDateChange(event: any) {
    if (event.target.value) {
      this.filters.endDate = new Date(event.target.value);
    }
  }

  onStartDateChange(event: any) {
    if (event.target.value) {
      this.filters.startDate = new Date(event.target.value);
    }
  }

  onSingleDateChange(event: any) {
    if (event.target.value) {
      this.filters.singleDate = new Date(event.target.value);
      this.dateRangeType = 'single';
    }
  }
}