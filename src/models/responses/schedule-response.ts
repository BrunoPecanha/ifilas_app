import { ScheduleModel } from "../schedule-model";

export interface ScheduleResponse {
  valid: boolean;
  data: ScheduleModel;
  message: string;
}
  