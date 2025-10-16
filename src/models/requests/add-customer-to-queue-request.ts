import { AddServiceRequest } from "./add-service-request";

export interface AddCustomerToQueueRequest {
  selectedServices: AddServiceRequest[];
  notes: string;
  paymentMethod: string;
  queueId: number;
  userId: number;
  looseCustomer: boolean;
}