import { AvailableDateModel } from "./available-date-model";
import { StoreModel } from "./store-model";

export interface ScheduleDateModel {
    store: StoreModel;
    daysWindow: number;
    availableDates: AvailableDateModel[];
}