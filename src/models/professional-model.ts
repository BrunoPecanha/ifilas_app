import { StatusQueueEnum } from "./enums/status-queue.enum";

export interface ProfessionalModel {
  id: number;
  queueId: number;
  name: string;
  lastName: string;
  subtitle: string;
  liked: boolean;
  queueName: string;
  servicesProvided: string;
  customersWaiting: number;
  averageWaitingTime: string;
  averageServiceTime: string;
  pauseReason: string;
  useAgenda: boolean;
  status: StatusQueueEnum;
  photoUrl: string;
  isNew: boolean;
  profileImage: string;
  distance: number;
  rating: number;
  numberOfRatings: number;
  isActive: boolean;
}