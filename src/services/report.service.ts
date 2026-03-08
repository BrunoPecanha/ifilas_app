import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

interface MetricsReportFilter {
  startDate: string;
  endDate: string;
  storeId?: number;
  employeeId?: number;
}

export interface MetricsReportResponse {
  valid: boolean;
  message: string;
  data: MetricsReportData;
}

export interface MetricsReportData {
  metadata: Metadata;
  metrics: Metrics;
  chartData: ChartData;
  attendances: Attendance[];
  servicesSummary: ServiceSummary[];
  paymentSummary: PaymentSummary[];
}

export interface Metadata {
  period: {
    startDate: string;
    endDate: string;
    periodType: string;
    daysInPeriod: number;
  };
  generatedAt: string;
  storeId: number;
}

export interface Metrics {
  totalCustomers: number;
  totalRevenue: number;
  averageTime: number;
  trends: Trends;
  additional: any;
}

export interface Trends {
  customersTrend: number;
  revenueTrend: number;
  timeTrend: number;
}

export interface ChartData {
  byDayOfWeek: ChartDay[];
  byHour: any;
  byWeek: any;
}

export interface ChartDay {
  dayOfWeek: number;
  dayLabel: string;
  dayFullName: string;
  count: number;
  percentage: number;
  color: string | null;
  revenue: number;
  averageTime: number;
}

export interface Attendance {
  id: number;
  customerId: number;
  customerName: string;
  startTime: string;
  date: string;
  paymentMethod: string;
  amount: number;
  service: string | null;
}

export interface ServiceSummary {
  serviceId: number;
  serviceName: string;
  count: number;
  revenue: number;
}

export interface PaymentSummary {
  paymentMethodId: number;
  paymentMethod: string;
  count: number;
  revenue: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {

  constructor(private http: HttpClient) { }

  getMetricsReport(
    userId: number,
    filter: MetricsReportFilter
  ): Observable<MetricsReportResponse> {

    return this.http.post<MetricsReportResponse>(
      `${environment.apiUrl}/report`,
      {
        userId,
        ...filter
      }
    );
  }
}