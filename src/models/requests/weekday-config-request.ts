
export interface WeekDayConfigRequest {
  dayOfWeek: number;
  label: string;
  enabled: boolean;
  startTime: string | null;
  endTime: string | null;
}