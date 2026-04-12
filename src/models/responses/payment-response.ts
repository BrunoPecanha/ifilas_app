import { PaymentModel } from "../payment-model";

export interface PaymentsResponse {
  valid: boolean;
  data: PaymentModel[];
  message: string;
}
  