export interface PaymentModel {
  id: number;
  storeId: number;
  type: number;
  activated: boolean;

  // PIX
  pixKey?: string | null;
  pixKeyType?: number | null;

  // Cartões
  acceptsCredit: boolean;
  acceptsDebit: boolean;
  acceptsMealTicket: boolean;
  maxInstallments: number;

  // Dinheiro
  acceptsChange?: boolean | null;
  changeLimit?: number | null;

  // Extras
  notes?: string | null;
  icon?: string | null;

  name?: string;
  imgPath?: string;
}