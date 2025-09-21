import { WeekDayConfigRequest } from 'src/models/requests/weekday-config-request';
import { ExceptionConfigRequest } from 'src/models/requests/exception-config-request';

export interface ScheduleCreateRequest {
  storeId: number;
  employeeId: number;
  description: string;
  date: string;
  openingTime: string;
  closingTime: string;
  type: 'normal' | 'priority' | 'express';
  eligibleGroups?: string[];
  slotDurationMinutes?: number;
  isRecurring: boolean;
  recurringDays?: number[];
  recurringEndDate?: string | null;
  weekDays?: WeekDayConfigRequest[];
  exceptions?: ExceptionConfigRequest[];
}
