import { CustomerServiceModel } from "./customer-service-model";

export interface CustomerModel {
  id: number;
  services: CustomerServiceModel[];
  name: string;
  total: number;
  paymentIcon: string;
  paymentMethodId: number;
  paymentMethod: string;
  notes: string;
  employeeAttedandtId: number;
}
