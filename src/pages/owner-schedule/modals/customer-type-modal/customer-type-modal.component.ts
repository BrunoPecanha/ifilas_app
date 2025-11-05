import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-customer-type-modal',
  templateUrl: "./customer-type-modal.component.html",
  styleUrls: ["./customer-type-modal.component.scss"]
})
export class CustomerTypeModalComponent {

  isSelecting: boolean = false;

  constructor(private modalController: ModalController) {
  }

  async selectType(type: 'app' | 'walkin') {
    if (this.isSelecting) return;

    this.isSelecting = true;

    try {
      // Pequeno delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 300));

      // Sua lógica de seleção
      this.modalController.dismiss(type);

    } catch (error) {
      console.error('Erro ao selecionar tipo:', error);
      this.isSelecting = false;
    }
  }

  // No dismiss também
  dismiss() {
    if (!this.isSelecting) {
      this.modalController.dismiss();
    }
  }
}