export interface ExceptionConfigRequest {
  id: number;
  reason?: string;
  date: string;
  start: string | null;
  end: string | null;
  fullDayClosed: boolean;
}