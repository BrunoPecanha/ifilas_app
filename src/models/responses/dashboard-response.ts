export interface DashBoardResponse {
  valid: boolean;
  data: DashboardData;
  message: string;
}

export interface DashboardData {
  queues: QueueItem[];
  schedules: ScheduleItem[];
}

export interface QueueItem {
  id: number;
  customerId: number;
  storeName: string | null;
  storeLogo: string | null;
  attendantsName: string | null;
  position: number;
  status: number;
  waitingTime: string;
  paymentMethod: PaymentMethod;
  services: string[];
  totalInQueue: number;
  arrivalTime: string;
  notes: string;  
  categoryIcon: string;
  isPaused: boolean;
  total: number;
}

export interface ScheduleItem {
  id: number;
  customerId: number;
  storeName: string;
  storeLogo: string;
  attendantsName: string;
  date: string;
  time: string;
  status: number;
  services: string[];
  paymentMethod: PaymentMethod;
  notes: string;
  categoryIcon: string;
  total: number;
}

export interface PaymentMethod {
  name: string;
  icon: string;
  details: string | null;
}