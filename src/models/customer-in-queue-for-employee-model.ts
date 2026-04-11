import { ServiceModel } from "./service-model";

export interface CustomerInQueueForEmployeeModel {
  id: number;
  payment: string;
  paymentIcon: string;
  name: string;
  services: ServiceModel[];
  queueId: number;
  timeGotInQueue: string;
  inService: boolean;
  timeCalledInQueue: Date;
  isPaused: boolean;
  canEditName: boolean;
  status: number;
  phone: string;
  pricePending: boolean;  
}