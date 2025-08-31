import { CustomerStatusEnum } from "./enums/customer-status.enum";

export interface CustomerInQueueCardModel {
  id: number;
  position: number;
  serviceQtd: number;
  storeIcon: string;
  payment: string;
  paymentIcon: string;
  timeToWait: number;
  logoPath: string;
  queueId: number;
  storeId: number;
  estimatedWaitingTime: string;
  isPaused: boolean;
  status: number;
  name: string;
}