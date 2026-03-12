import { StoreModel } from "../store-model";

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
  store: StoreModel;
  attendantsName: string | null;
  position: number;
  status: number;
  waitingTime: string;
  paymentMethod: PaymentMethod;
  services: string[];
  totalInQueue: number;
  arrivalTime: string;
  predictedStartAt: string;
  notes: string;
  categoryIcon: string;
  isPaused: boolean;
  pauseReason: string | null;
  total: number;
  totalString: string | null;
}

export interface ScheduleItem {
  id: number;
  customerId: number;
  store: StoreModel;
  attendantsName: string;
  date: string;
  time: string;
  status: number;
  services: string[];
  paymentMethod: PaymentMethod;
  notes: string;
  categoryIcon: string;
  total: number;
  totalString: string | null;
}

export interface PaymentMethod {
  type: number;
  name?: string;
  icon: string;

  selected: boolean;

  // PIX
  pixKey?: string | null;
  pixKeyType?: number | null;

  // Cartão
  acceptsCredit?: boolean | null;
  acceptsDebit?: boolean | null;
  maxInstallments?: number | null;

  // Dinheiro
  acceptsChange?: boolean | null;
  changeLimit?: number | null;

  // Outros
  acceptsMealTicket?: boolean | null;

  // Informações extras
  notes?: string | null;
  details?: string | null;
}