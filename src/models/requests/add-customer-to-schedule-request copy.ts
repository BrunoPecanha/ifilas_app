import { AddServiceRequest } from "./add-service-request";

export interface AddCustomerToScheduleRequest {
  selectedServices: AddServiceRequest[];
  notes: string;
  paymentMethod: number;
  storeId: number;
  professionalId: number;
  time: string;
  date: Date;
  customerId: number;
  looseCustomer: boolean;
}