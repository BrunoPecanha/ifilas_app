
export interface WeekDayConfigRequest {
  id: number;
  dayOfWeek: number;
  label: string;
  enabled: boolean;
  startTime: string | null;
  endTime: string | null;
}