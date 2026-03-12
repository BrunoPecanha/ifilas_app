import { Component, Input, Output, EventEmitter } from "@angular/core";
import { ServiceModel } from "src/models/service-model";

export type QuickModalMode = 'qrcode' | 'services';

@Component({
  selector: 'app-quick-modal',
  templateUrl: './quick-modal.component.html',
  styleUrls: ['./quick-modal.component.scss'],
})
export class QuickModalComponent {
  @Input() isOpen = false;
  @Input() mode: 'qrcode' | 'services' | 'summary' = 'qrcode';

  @Input() qrCodeDataUrl?: string;
  @Input() isLoading = false;

  @Input() customer: any;

  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();


  paymentIcons: Record<number, string> = {
    1: 'qr-code-outline',
    2: 'card-outline',
    3: 'cash-outline',
    4: 'repeat-outline',
    5: 'document-text-outline',
    6: 'swap-horizontal-outline'
  };

  paymentColors: Record<number, string> = {
    1: '#32ade6',
    2: '#007aff',
    3: '#34c759',
    4: '#5856d6',
    5: '#ff9500',
    6: '#af52de'
  };

  paymentNames: Record<number, string> = {
    1: 'Pix',
    2: 'Cartão',
    3: 'Dinheiro',
    4: 'Débito automático',
    5: 'Boleto',
    6: 'Transferência'
  };

  get paymentType(): number | undefined {
    return this.customer?.paymentMethodId;
  }

  get paymentIcon(): string {
    return this.paymentIcons[this.customer.paymentMethodId ?? 0] || 'wallet-outline';
  }

  get paymentColor(): string {
    return this.paymentColors[this.customer.paymentMethodId ?? 0] || '#8e8e93';
  }

  get paymentName(): string {
    return this.paymentNames[this.customer.paymentMethodId ?? 0] || 'A definir';
  }

  getTotalPrice(): number {
    if (!this.customer || !this.customer.services || this.customer.services.length === 0) {
      return 0;
    }

    return this.customer.services.reduce((total: number, s: { finalPrice: number; quantity: number; }) => {
      const price = s.finalPrice ?? 0;
      const quantity = s.quantity ?? 1;
      return total + price * quantity;
    }, 0);
  }
}