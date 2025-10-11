import { AddServiceRequest } from "./add-service-request";

export interface UpdateCustomerToQueueRequest {
  selectedServices: AddServiceRequest[];
  notes: string;
  paymentMethod: number;
  id: number;
}