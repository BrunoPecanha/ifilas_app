import { AddressModel } from "../address-model";

export interface addressResponse {
  valid: boolean;
  data: AddressModel;
  message: string;
}
  