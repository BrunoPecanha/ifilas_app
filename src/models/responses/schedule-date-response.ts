import { ScheduleDateModel } from "../schedule-date-model";

export interface ScheduleDateResponse {
  valid: boolean;
  data: ScheduleDateModel;
  message: string;
}
  