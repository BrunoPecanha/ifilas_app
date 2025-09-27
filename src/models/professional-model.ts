import { StatusQueueEnum } from "./enums/status-queue.enum";

export interface ProfessionalModel {
  id: number;
  queueId: number;
  name: string;
  subtitle: string;
  liked: boolean;
  queueName: string;
  servicesProvided: string;
  customersWaiting: number;
  averageWaitingTime: string;
  averageServiceTime: string;
  pauseReason: string;
  status: StatusQueueEnum;
  photoUrl: string;
  isNew: boolean;
  distance: number;
  rating: number;
  numberOfRatings: number;
}