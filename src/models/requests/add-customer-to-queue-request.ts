import { AddServiceRequest } from "./add-service-request";

export interface AddCustomerToQueueRequest {
  selectedServices: AddServiceRequest[];
  notes: string;
  paymentMethod: number;
  queueId: number;
  userId: number;
  looseCustomer: boolean;
}