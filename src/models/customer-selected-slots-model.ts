import { ServiceModel } from "./service-model";

export interface CustomerSelectedSlotsModel {
  id: number,
  slotStart: string;
  slotEnd: string;
  customerName: string;
  services: ServiceModel[];
  total: number;
  isBooked: boolean;
  totalSlots: number;
}