import { ProfessionalModel } from "./professional-model";

export interface StoreProfessionalModel {
  id: number;
  storeLogoPath: string;
  wallPaperPath: string;
  name: string;
  subtitle: string;
  useAgenda: boolean;
  professionals: ProfessionalModel[]
  isVerified: boolean;
  rating: number;
}