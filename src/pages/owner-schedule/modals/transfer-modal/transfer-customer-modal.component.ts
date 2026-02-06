import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

interface Professional {
  id: number;
  nome: string;
  scheduleId: number;
  queueId: number;
  especialidade?: string;
  disponibilidade?: string;
  isActive?: boolean;
  disabled?: boolean;
  avatar?: string;
  avatarColor?: string;
}

@Component({
  selector: 'app-transfer-customer-modal',
  templateUrl: './transfer-customer-modal.component.html',
  styleUrls: ['./transfer-customer-modal.component.scss']
})
export class TransferCustomerModalComponent implements OnInit {

  @Input() professionals: Professional[] = [];
  @Input() currentProfessionalId?: number;
  @Input() customerName?: string;
  @Input() isQueue?: boolean = false;

  selectedProfessional: Professional | null = null;
  isLoading = false;

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {
    if (this.currentProfessionalId && this.professionals) {
      this.professionals = this.professionals.map(prof => ({
        ...prof,
        disabled: prof.id === this.currentProfessionalId
      }));
    }

    this.professionals = this.professionals.map((prof, index) => ({
      ...prof,
      avatarColor: this.getAvatarColor(index),
      isActive: prof.isActive ?? true
    }));
  }

  select(prof: Professional) {
    if (prof.disabled)
      return;
    if (!prof.queueId) return;

    this.selectedProfessional = prof;
  }

  confirmTransfer() {
    if (!this.selectedProfessional || !this.selectedProfessional.queueId) 
      return;

    this.isLoading = true;

    setTimeout(() => {
      this.modalCtrl.dismiss({
        scheduleId: this.selectedProfessional?.scheduleId,
        queueId: this.selectedProfessional?.queueId,
        professionalId: this.selectedProfessional?.id,
        professionalName: this.selectedProfessional?.nome,
        confirmed: true
      });
    }, 300);
  }

  close() {
    this.modalCtrl.dismiss({
      cancelled: true
    });
  }

  private getAvatarColor(index: number): string {
    const colors = [
      'var(--ion-color-primary)',
      'var(--ion-color-secondary)',
      'var(--ion-color-tertiary)',
      'var(--ion-color-success)',
      'var(--ion-color-warning)',
      'var(--ion-color-danger)'
    ];

    return colors[index % colors.length];
  }

  getInitials(nome: string): string {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  get hasAvailableProfessionals(): boolean {
    return this.professionals?.some(prof => !prof.disabled);
  }

  get availableProfessionals(): Professional[] {
    return this.professionals?.filter(prof => !prof.disabled) || [];
  }
}