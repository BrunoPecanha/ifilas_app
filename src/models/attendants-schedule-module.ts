import { CustomerModel } from "./customer-model";
import { SlotReducedModel } from "./schedule-model";

export interface AttendantsScheduleModel {
  slots: SlotReducedModel[];
  customers?: CustomerModel[];
  slotDuration: number;
  scheduleId: number;
}