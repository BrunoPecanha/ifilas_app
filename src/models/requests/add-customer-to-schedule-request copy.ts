import { AddServiceRequest } from "./add-service-request";

export interface AddCustomerToScheduleRequest {
  selectedServices: AddServiceRequest[];
  notes: string;
  paymentMethod: number;
  storeId: number;
  scheduleId: number;
  professionalId: number;
  time: string;
  date: Date;
  customerId: number;
  looseCustomer: boolean;
  looseCustomerName: string;
  editingExistingAppointment?: boolean;
}