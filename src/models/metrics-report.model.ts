export interface MetricsReportResponse {

  metrics: {
    totalCustomers: number;
    totalAttendances: number;
    averageWaitTime: number;
    averageServiceTime: number;
  };

  customers: {
    id: number;
    name: string;
    arrivalTime: string;
    waitTime: number;
    serviceTime: number;
  }[];

}