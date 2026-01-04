import { CustomerSelectedSlotsModel } from "./customer-selected-slots-model";
import { CustomerServiceModel } from "./customer-service-model";

export interface CustomerModel {
  id: number;
  services: CustomerServiceModel[];
  name: string;
  customerSelectedSlots: CustomerSelectedSlotsModel;
  imageUrl: string | null;
  total: number;
  paymentIcon: string;
  status: number;
  isTransfered: boolean;
  paymentMethodId: number;
  paymentMethod: string;
  notes: string;
  employeeAttedandtId: number;
}
