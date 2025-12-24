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

  @Input() services: ServiceModel[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();


  getTotalPrice(): number {
    if (!this.services || this.services.length === 0) {
      return 0;
    }
    
    return this.services.reduce((total, s) => {
      const price = s.finalPrice ?? 0;
      const quantity = s.quantity ?? 1;
      return total + price * quantity;
    }, 0);
  }
}