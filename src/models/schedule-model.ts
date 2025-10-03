export interface ScheduleModel {
    id: number;
    storeId: number;
    professionalId: number;
    professionalName?: string | null;
    startDate: string;
    endDate: string;
    slotDurationInMinutes: number;
    agendaInterval: number;
    weeklySchedules: WeeklyScheduleModel[];
    exceptions: ExceptionModel[];
    slots: SlotModel[];
}

export interface WeeklyScheduleModel {
    id: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    enabled: boolean;
}

export interface ExceptionModel {
    id: number;
    date: string;
    startTime: string | null;
    endTime: string | null;
    fullDayClosed: boolean;
    reason?: string;
}

export interface SlotModel {
    id: number;
    slotStart: string;
    slotEnd: string;
    customerName: string | null;
    services: ServiceBookedModel[];
    total: number;
    isBooked: boolean;
}

export interface ServiceBookedModel {
    [serviceName: string]: number;
}
