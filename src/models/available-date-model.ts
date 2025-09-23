import { TimeSlotModel } from "./time-slot-model";

export interface AvailableDateModel {
  date: Date;
  available: boolean;
  timeSlots: TimeSlotModel[];
}