import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { PaymentModel } from 'src/models/payment-model';
import { UpdateCustomerToQueueRequest } from 'src/models/requests/update-customer-to-queue-request';
import { PaymentsResponse } from 'src/models/responses/payment-response';
import { ServiceModel } from 'src/models/service-model';
import { PaymentService } from 'src/services/payment-service';
import { QueueService } from 'src/services/queue.service';
import { SignalRService } from 'src/services/seignalr.service';
import { SessionService } from 'src/services/session.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
})
export class CheckoutPage implements OnInit {
  storeData = {
    name: '',
    address: ''
  };

  professionalData = {
    name: '',
    avatar: '',
    specialty: ''
  };

  selectedServices: ServiceModel[] = [];
  totalDuration = 0;
  subtotal = 0;

  selectedDate: Date = new Date();
  selectedTimeSlot = '';
  estimatedEndTime = '';

  paymentMethods: PaymentModel[] = [];

  selectedPaymentMethod?: PaymentModel;
  selectedInstallments = 1;
  installmentsOptions: number[] = [];
  monthlyInstallment = 0;

  serviceFeePercent = 5; // % de taxa de serviço
  serviceFee = 0;
  discount = 0;
  finalTotal = 0;
  paymentMethod: any;
  totalTimeString: string = '';
  flow: any;
  storeId: any;
  queueId: any;
  professionalId: any;
  customerId: any;
  looseCustomer: boolean = false;
  looseCustomerName: any;
  notes: any;
  userId: any;
  editingExistingAppointment: any;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private sessionService: SessionService,
    private paymentService: PaymentService,
    private queueService: QueueService,
    private signalRService: SignalRService
  ) {
    this.loadCheckoutData();
  }

  ngOnInit() {
    this.loadPayments();
  }

  ionViewWillEnter() {
    this.loadCheckoutData();
    this.calculateTotals();
    this.calculateEstimatedEndTime();
  }

  loadCheckoutData() {
    const navState = this.router.getCurrentNavigation()?.extras?.state as any;
    const historyState = history.state || {};

    const state =
      navState ||
      historyState ||
      this.sessionService.getGenericKey('queueCheckoutContext') ||
      {};

    if (state) {
      this.storeData = state.storeData || this.storeData;
      this.professionalData = {
        name: state.professionalName || state.professionalData?.name || '',
        avatar: state.professionalData?.avatar || '',
        specialty: state.professionalData?.specialty || ''
      };

      this.selectedServices = state.selectedServices || [];
      this.selectedDate = state.selectedDate ? new Date(state.selectedDate) : new Date();
      this.selectedTimeSlot = state.selectedTimeSlot || '';
      this.discount = state.discount || 0;
      this.totalDuration = state.totalTimeString;

      this.paymentMethod = state.paymentMethod || 1;
      this.flow = state.flow || 'queue';
      this.totalTimeString = state.totalTimeString;

      this.storeId = state.storeId || 0;
      this.queueId = state.queueId || 0;
      this.userId = state.userId || 0;
      this.professionalId = state.professionalId || 0;
      this.customerId = state.customerId ?? null;
      this.looseCustomer = !!state.looseCustomer;
      this.looseCustomerName = state.looseCustomerName || '';
      this.notes = state.notes || '';
    }
  }

  get hasVariablePrice(): boolean {
    return this.selectedServices.some(s => s.variablePrice);
  }

  loadPayments(): void {
    this.paymentService.loadPayments(this.storeId).subscribe({
      next: (response: PaymentsResponse) => {
        if (response.valid && response.data) {

          this.paymentMethods = response.data.map(p => ({
            ...p,
            icon: this.getPaymentIcon(p.type)
          }));

        } else {
          this.paymentMethods = [];
        }
      },
      error: () => {
        this.paymentMethods = [];
      }
    });
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} min`;
    } else {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} h`;
    }
  }

  calculateTotals() {
    this.subtotal = this.selectedServices.reduce((sum, service) => {
      const quantity = Number(service.quantity) || 1;
      const price = Number(service.price) || 0;
      return sum + (price * quantity);
    }, 0);

    this.totalDuration = this.selectedServices.reduce((sum, service) => {
      const quantity = Number(service.quantity) || 1;
      const duration = Number(service.duration) || 0;
      return sum + (duration * quantity);
    }, 0);

    this.serviceFee = (this.subtotal * this.serviceFeePercent) / 100;
    this.finalTotal = this.subtotal + this.serviceFee - this.discount;
    this.calculateInstallments();
  }

  calculateEstimatedEndTime() {
    const [hours, minutes] = this.selectedTimeSlot.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime.getTime() + this.totalDuration * 60000);
    this.estimatedEndTime = endTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatHoursAndMinutes(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes} minutos`;
    } else if (minutes === 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hora${hours > 1 ? 's' : ''} e ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    }
  }

  getPaymentIcon(type: number): string {
    switch (type) {
      case 1: return 'qr-code-outline';
      case 2: return 'card-outline';
      case 3: return 'cash-outline';
      case 4: return 'card-outline';
      case 5: return 'document-text-outline';
      case 6: return 'swap-horizontal-outline';
      case 7: return 'restaurant-outline';
      default: return 'wallet-outline';
    }
  }

  selectPaymentMethod(method: PaymentModel) {
    this.selectedPaymentMethod = method;

    const isCreditCard =
      method.type === 2 && method.acceptsCredit === true;

    if (isCreditCard) {
      this.installmentsOptions = Array.from(
        { length: method.maxInstallments || 1 },
        (_, i) => i + 1
      );
    } else {
      this.installmentsOptions = [];
      this.selectedInstallments = 1;
    }
  }

  calculateInstallments() {
    if (this.selectedPaymentMethod?.type !== undefined && this.selectedPaymentMethod?.type === 2 && this.selectedInstallments > 1) {
      this.monthlyInstallment = this.finalTotal / this.selectedInstallments;
    } else {
      this.monthlyInstallment = this.finalTotal;
    }
  }

  get currentTime(): string {
    const now = new Date();

    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  calculateInstallmentValue(installments: number): number {
    return this.finalTotal / installments;
  }

  async confirmCheckout() {
    if (!this.selectedPaymentMethod) {
      const toast = await this.toastController.create({
        message: 'Por favor, selecione uma forma de pagamento',
        duration: 3000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Atendimento',
      message: `
        Podemos prosseguir com a entrada na agenda?
    `,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.processCheckout();
          }
        }
      ]
    });

    await alert.present();
  }

  async processCheckout() {
    const loading = await this.alertController.create({
      header: 'Processando...',
      message: 'Estamos confirmando sua fila',
      backdropDismiss: false
    });

    await loading.present();

    const servicesToSend = this.selectedServices.map(service => ({
      id: service.id,
      quantity: service.quantity || 1
    }));

    try {
      if (this.customerId) {
        const command: UpdateCustomerToQueueRequest = {
          selectedServices: servicesToSend,
          notes: this.notes || '',
          paymentMethod: Number(this.selectedPaymentMethod?.type || 1),
          id: this.customerId,
        };

        await this.queueService.updateCustomerToQueue(command).toPromise();
        await this.initSignalRConnection();
        this.navigateAfterQueue();
      }
      else {        
        const command = {
          selectedServices: servicesToSend,
          notes: this.notes,
          paymentMethod: Number(this.selectedPaymentMethod?.type || 1),
          professionalId: this.professionalId,
          queueId: this.queueId,
          userId: this.customerId || this.userId,
          looseCustomer: this.looseCustomer
        };

        await this.queueService.addCustomerToQueue(command).toPromise();
        await loading.dismiss();
        this.navigateAfterQueue();
      }

      this.sessionService.removeGenericKey('queueCheckoutContext');

    } catch (err) {
      await loading.dismiss();
      console.error(err);
    }
  }

  private navigateAfterQueue() {
    const queryParams = {
      userId: this.userId,
      editingExistingAppointment: this.editingExistingAppointment
    };
    this.router.navigate(['/confirmation'], { queryParams });
  }

  private async initSignalRConnection() {
    try {
      await this.signalRService.startQueueConnection();
    } catch (error) {
      setTimeout(() => this.initSignalRConnection(), 5000);
    }
  }

  goBack() {
    const route = this.flow === 'queue'
      ? '/select-services'
      : '/schedule-appointment';

    this.router.navigate([route]);
  }
}