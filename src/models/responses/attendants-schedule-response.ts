import { AttendantsScheduleModel } from "../attendants-schedule-module";

export interface AttendantsScheduleResponse {
  valid: boolean;
  data: AttendantsScheduleModel;
  message: string;
}
  