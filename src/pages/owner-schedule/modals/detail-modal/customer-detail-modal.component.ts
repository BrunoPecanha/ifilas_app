import { Component, Input } from '@angular/core';
import {
  AlertController,
  ModalController
} from '@ionic/angular';

import { PaymentMethodEnum } from 'src/models/enums/payment-method';
import { StoreModel } from 'src/models/store-model';
import { UserModel } from 'src/models/user-model';
import { ScheduleService } from 'src/services/schedule.service';
import { SessionService } from 'src/services/session.service';
import { ToastService } from 'src/services/toast.service';

@Component({
  selector: 'app-customer-detail-modal',
  templateUrl: './customer-detail-modal.component.html',
  styleUrls: ['./customer-detail-modal.component.scss']
})
export class CustomerDetailModalComponent {

  user!: UserModel;
  store!: StoreModel;
  @Input() customer: any;
  isDeleting = false;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private sessionService: SessionService,
    private service: ScheduleService,
    private toastController: ToastService
  ) {
    this.user = this.sessionService.getUser();
    this.store = this.sessionService.getStore();

  }

  dismiss() {
    this.modalController.dismiss();
  }

  getTotalPrice(): number {
    if (!this.customer?.services) {
      return 0;
    }

    return this.customer.services.reduce(
      (acc: number, service: any) =>
        acc + (service?.finalPrice || 0),
      0
    );
  }

  showPrice(value?: number | null): string {
    if (!this.canShowPaymentDetails)
      return '••••';

    if (value == null || isNaN(value))
      return '-';

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  get canShowPaymentDetails(): boolean {
    if (!this.store?.hideAmountsWhenTransferringCustomers)
      return true;

    if (!this.customer?.isTransfered) {
      return true;
    }

    return this.store.ownerId === this.user.id;
  }

  public getStatusDescription(status: string): string {
    const normalizedStatus = status?.toLowerCase()?.trim();

    const statusMap: { [key: string]: string } = {
      waiting: 'Aguardando',
      removed: 'Removido',
      inservice: 'Em atendimento',
      done: 'Finalizado',
      absent: 'Ausente',
      cancelled: 'Cancelado',
      pending: 'Pendente',
      rejected: 'Rejeitado',
      next: 'Proximo',
      confirmed: 'Confirmado',
      scheduled: 'Agendado'
    };

    return statusMap[normalizedStatus] || 'pending';
  }

  getPaymentName(type: PaymentMethodEnum): string {
    switch (Number(type)) {
      case PaymentMethodEnum.pix:
        return 'Pix';
      case PaymentMethodEnum.card:
        return 'Cartão';
      case PaymentMethodEnum.cash:
        return 'Dinheiro';
      case PaymentMethodEnum.automaticDebit:
        return 'Débito Automático';
      case PaymentMethodEnum.boleto:
        return 'Boleto';
      case PaymentMethodEnum.bankTransfer:
        return 'Transferência';
      case PaymentMethodEnum.mealTicket:
        return 'Vale Refeição';
      default:
        return 'Não informado';
    }
  }

  getPaymentColor(type: number): string {

    const colors: Record<number, string> = {
      [PaymentMethodEnum.pix]: '#32ade6',
      [PaymentMethodEnum.card]: '#007aff',
      [PaymentMethodEnum.cash]: '#34c759',
      [PaymentMethodEnum.automaticDebit]: '#5856d6',
      [PaymentMethodEnum.boleto]: '#ff9500',
      [PaymentMethodEnum.bankTransfer]: '#af52de',
      [PaymentMethodEnum.mealTicket]: '#ff3b30'
    };

    return colors[type] || '#8e8e93';
  }

  paymentIcons: Record<number, string> = {
    [PaymentMethodEnum.pix]: 'phone-portrait-outline',
    [PaymentMethodEnum.card]: 'card-outline',
    [PaymentMethodEnum.cash]: 'cash-outline',
    [PaymentMethodEnum.automaticDebit]: 'refresh-circle-outline',
    [PaymentMethodEnum.boleto]: 'document-text-outline',
    [PaymentMethodEnum.bankTransfer]: 'swap-horizontal-outline',
    [PaymentMethodEnum.mealTicket]: 'restaurant-outline'
  };

  getPaymentIcon(type: number): string {
    return this.paymentIcons[type] || 'wallet-outline';
  }

  deleteAppointment() {
    this.confirmDeleteCustomer(this.customer);
  }

  async confirmDeleteCustomer(customer: any) {

    const alert = await this.alertController.create({
      header: 'Remover Atendimento',
      message: `Deseja realmente remover o atendimento de ${customer.name}?`,
      cssClass: 'delete-confirm-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-cancel'
        },
        {
          text: 'Remover',
          cssClass: 'alert-delete',
          handler: () => {
            this.executeDeleteCustomer(customer);
          }
        }
      ]
    });

    await alert.present();
  }

  private executeDeleteCustomer(customer: any) {

    if (this.isDeleting) {
      return;
    }

    this.isDeleting = true;

    this.service
      .removeMissingCustomer(
        customer.id,
        'Removido pelo responsável pelo atendimento'
      )
      .subscribe({
        next: () => {

          this.toastController.show(
            'Atendimento removido com sucesso!',
            'success'
          );

          this.modalController.dismiss({
            action: 'delete',
            customerId: customer.id
          });

          this.isDeleting = false;
        },

        error: () => {

          this.toastController.show(
            'Erro ao remover atendimento',
            'danger'
          );

          this.isDeleting = false;
        }
      });
  }
}