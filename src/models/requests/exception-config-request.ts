export interface ExceptionConfigRequest {
  reason?: string;
  date: string;
  start: string | null;
  end: string | null;
  fullDayClosed: boolean;
}