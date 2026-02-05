import { Component, OnInit } from '@angular/core';
import { ToastService } from 'src/services/toast.service';
import { AlertController } from '@ionic/angular';
import { OrderModel } from 'src/models/order-model';
import { OrderService } from 'src/services/order.service';
import { SessionService } from 'src/services/session.service';
import { OrderRequest } from 'src/models/requests/order-request';
import { StoreModel } from 'src/models/store-model';
import { UserModel } from 'src/models/user-model';
import { CustomerStatusEnum } from 'src/models/enums/customer-status.enum';
import { firstValueFrom, Subscription } from 'rxjs';
import { SignalRService } from 'src/services/seignalr.service';

@Component({
  selector: 'app-order-approval',
  templateUrl: './order-approval.page.html',
  styleUrls: ['./order-approval.page.scss'],
})
export class OrderApprovalPage implements OnInit {

  currentDate = new Date();
  activeOrders: OrderModel[] = [];
  processedOrders: OrderModel[] = [];

  showRejectModal = false;
  selectedOrder: OrderModel | null = null;
  rejectReason: string = '';
  isLoading: boolean = false;
  filter: string = 'pending';
  store!: StoreModel;
  user!: UserModel;
  private ordersSignalRSub?: Subscription;
  private subscribed = false;

  constructor(
    private toastService: ToastService,
    private alertController: AlertController,
    private orderService: OrderService,
    private sessionService: SessionService,
    private signalRService: SignalRService
  ) {
    this.store = this.sessionService.getStore();
    this.user = this.sessionService.getUser();
  }

  ngOnInit() {
    this.loadOrders();
  }

  async ionViewWillEnter() {
    await this.signalRService.startNotificationConnection();

    this.ordersSignalRSub = this.signalRService
      .onOrderUpdated$()
      .subscribe(() => {
        this.loadOrders();
      });
  }

  ionViewWillLeave() {
    this.ordersSignalRSub?.unsubscribe();
  }

  async loadOrders() {
    try {
      this.isLoading = true;

      const response = await firstValueFrom(
        this.orderService.getOrdersWatingApprovmentByEmployee(this.store.id, this.user.id)
      );

      if (response.valid && response.data) {
        const orders = response.data.map((o: any) => ({
          orderNumber: o.orderNumber,
          items: o.items,
          name: o.name,
          total: o.total,
          paymentMethodId: o.paymentMethodId,
          paymentIcon: o.paymentIcon,
          paymentMethod: o.paymentMethod,
          notes: o.notes,
          priority: o.priority,
          status: o.status,
          processedAt: o.processedAt,
          processedByName: o.processedByName,
          rejectionReason: o.rejectionReason,
        }));

        this.activeOrders = orders.filter(o => o.status === 6);
        this.processedOrders = orders.filter(o => o.status !== 6);
      }
    } catch (error) {
      this.toastService.show('Erro ao carregar pedidos', 'danger');
      console.error('Erro:', error);
    } finally {
      this.isLoading = false;
    }
  }

  get filteredOrders() {
    if (this.filter === 'pending') {
      return this.activeOrders;
    }

    if (this.filter === 'history') {
      return [...this.processedOrders]
        .sort((a, b) =>
          new Date(b.processedAt || 0).getTime() -
          new Date(a.processedAt || 0).getTime()
        );
    }

    return [];
  }

  getStatusLabel(status: number): string {
    if (status === 6)
      return 'Pendente';
    if (status === 7)
      return 'Rejeitado';

    return 'Aprovado';
  }

  getStatusColor(status: number): string {
    if (status === 6)
      return 'warning';
    if (status === 7)
      return 'danger';

    return 'success';
  }

  getServiceIcon(serviceName: string): string {
    const icons: { [key: string]: string } = {
      'Corte de Cabelo': 'cut',
      'Corte Social': 'cut',
      'Barba': 'barbell',
      'Manicure': 'hand-left',
      'Pedicure': 'foot',
      'Hidratação': 'water',
      'Sobrancelha': 'eye',
      'Coloração': 'color-fill'
    };
    return icons[serviceName] || 'pricetag';
  }

  async handleRefresh(event: any) {
    try {
      await this.loadOrders();
    } finally {
      event.target.complete();
    }
  }

  async approveOrder(order: OrderModel) {
    const confirm = await this.alertController.create({
      header: 'Confirmar Aprovação',
      message: `Deseja aprovar o pedido #${order.orderNumber} de ${order.name}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aprovar',
          handler: async () => {
            await this.processOrder(order, CustomerStatusEnum.Waiting, 'Pedido aprovado!');
          }
        }
      ]
    });

    await confirm.present();
  }


  async rejectOrder(order: OrderModel) {
    const alert = await this.alertController.create({
      header: 'Confirmar Rejeição',
      message: `Deseja rejeitar o pedido #${order.orderNumber}?`,
      inputs: [
        {
          name: 'reason',
          type: 'text',
          placeholder: 'Motivo da rejeição'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rejeitar',
          handler: async (data) => {
            const reason = data.reason?.trim();
            if (!reason) {
              this.toastService.show('Informe o motivo da rejeição.', 'danger');
              return;
            }
            await this.processOrder(order, CustomerStatusEnum.Rejected, 'Pedido rejeitado!', reason);
          }
        }
      ]
    });

    await alert.present();
  }

  private async processOrder(
    order: OrderModel,
    status: number,
    successMessage: string,
    rejectReason: string = ''
  ) {
    try {
      this.isLoading = true;

      const request: OrderRequest = {
        status: status,
        responsibleEmployee: this.user.id,
        rejectReason: rejectReason
      };

      await this.orderService.processOrder(order.orderNumber, request).toPromise();

      this.activeOrders = this.activeOrders.filter(o => o.orderNumber !== order.orderNumber);

      const color = status === 8 ? 'danger' : 'success';
      this.toastService.show(`${successMessage} Pedido #${order.orderNumber}.`, color);
    } catch (error) {
      this.toastService.show('Falha ao processar pedido.', 'danger');
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }


  getServiceColor(serviceName: string): string {
    const colors: { [key: string]: string } = {
      'Corte de Cabelo': 'primary',
      'Corte Social': 'primary',
      'Barba': 'secondary',
      'Manicure': 'tertiary',
      'Pedicure': 'tertiary',
      'Hidratação': 'success',
      'Sobrancelha': 'warning',
      'Coloração': 'danger'
    };
    return colors[serviceName] || 'medium';
  }
}
