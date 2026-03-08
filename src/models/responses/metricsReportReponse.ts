import { MetricsReportResponse } from "../metrics-report.model";

export interface MetricsReportReponse {
  valid: boolean;
  data: MetricsReportResponse;
  message: string;
}
  