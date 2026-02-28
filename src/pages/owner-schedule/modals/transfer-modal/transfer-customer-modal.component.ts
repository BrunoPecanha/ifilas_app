import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ToastService } from 'src/services/toast.service';

interface Professional {
  id: number;
  nome: string;
  scheduleId: number | null;
  queueId: number | null;
  useAgenda: boolean;
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

  selectedProfessional: Professional | null = null;

  constructor(private modalCtrl: ModalController, private toastService: ToastService) { }

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
      isActive: prof.isActive ?? true,
      scheduleId: prof.scheduleId,
      useAgenda: prof.useAgenda,
      queueId: prof.queueId
    }));
  }

  select(prof: Professional) {
    if (prof.disabled) {
      this.toastService.show('Você não pode transferir para este profissional.', 'warning');
      return;
    }

    if (prof.useAgenda && !prof.scheduleId) {
      this.toastService.show('Este profissional não possui agenda disponível.', 'warning');
      return;
    }

    if (!prof.useAgenda && !prof.queueId) {
      this.toastService.show('Este profissional ainda não abriu a fila.', 'warning');
      return;
    }

    this.selectedProfessional = prof;
  }

  confirmTransfer() {
    if (!this.selectedProfessional)
      return;

    const reason = this.getUnavailableReason(this.selectedProfessional);

    if (reason) {
      this.toastService.show(reason, 'warning');
      return;
    }

    const prof = this.selectedProfessional;

    this.modalCtrl.dismiss({
      scheduleId: prof.useAgenda ? prof.scheduleId : null,
      queueId: !prof.useAgenda ? prof.queueId : null,
      professionalId: prof.id,
      professionalName: prof.nome,
      useAgenda: prof.useAgenda,
      confirmed: true
    });
  }

  isSelectable(prof: Professional): boolean {
    return !this.getUnavailableReason(prof);
  }

  handleClick(prof: Professional) {
    const reason = this.getUnavailableReason(prof);

    if (reason) {
      this.toastService.show(reason, 'warning');
      return;
    }

    this.selectedProfessional = prof;
  }

  getUnavailableReason(prof: Professional): string | null {
    if (prof.disabled)
      return 'Você não pode transferir para este profissional.';

    if (prof.useAgenda) {
      if (!prof.scheduleId)
        return 'Este profissional não possui agenda disponível.';
    }

    if (!prof.useAgenda) {
      if (!prof.queueId)
        return 'Este profissional não possui fila aberta.';
    }

    return null;
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