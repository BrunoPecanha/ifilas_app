import { StatusQueueEnum } from "./enums/status-queue.enum";

export interface ScheduleModel {
    id: number;                 
    storeId: string;  
    name: string;
    description: string;
    registeringDate?: Date;
    lastUpDate?: Date;
    status: StatusQueueEnum;
    timeGotInQueue: string;
    employeeId: string;
    services: string[];
    date: Date;
    currentCount: number;
    responsibleId: number;
    responsibleName: string;
    queueDescription: string;
    totalCount: number;
}
