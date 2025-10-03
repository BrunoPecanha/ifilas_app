import { HighLightRequest } from "./highlight-request";
import { OpeningHoursRequest } from "./opening-hours-request";

export interface StoreRequest {
  ownerId: number;
  cnpj: string;
  name: string;
  address: string;
  number: string;
  city: string;
  state: string;
  openAutomatic: boolean;
  storeSubtitle: string;
  acceptOtherQueues: boolean;
  answerOutOfOrder: boolean;
  answerScheduledTime: boolean;
  timeRemoval?: number | null;
  whatsAppNotice: boolean;
  logo: string;
  wallPaper: string;
  categoryId: number;
  openingHours: OpeningHoursRequest[];
  highLights: HighLightRequest[];
  attendSimultaneously: boolean;
  phoneNumber: string;
  instagram: string;
  inCaseFailureAcceptFinishWithoutQRCode: boolean;
  releaseOrdersBeforeGetsQueued: boolean;
  endServiceWithQRCode: boolean;
  startServiceWithQRCode: boolean;
  shareQueue: boolean;
  useAgenda: boolean;
  useQueue: boolean;
  whatsapp: string;
  facebook: string;
  youtube: string;
  website: string;
}