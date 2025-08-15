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
import { firstValueFrom } from 'rxjs';

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
  filter: string = 'all';
  store!: StoreModel;
  user!: UserModel;

  constructor(
    private toastService: ToastService,
    private alertController: AlertController,
    private orderService: OrderService,
    private sessionService: SessionService
  ) {
    this.store = this.sessionService.getStore();
    this.user = this.sessionService.getUser();
  }

  ngOnInit() {
    this.loadOrders();
  }

  ionViewWillEnter() {
    this.loadOrders();
  }

  async loadOrders() {
    try {
      this.isLoading = true;

      const response = await firstValueFrom(
        this.orderService.getOrdersWatingApprovmentByEmployee(this.store.id, this.user.id)
      );

      if (response.valid && response.data) {
        this.activeOrders = response.data.map((o: any) => ({
          orderNumber: o.orderNumber,
          items: o.items.map((item: any) => ({
            serviceId: item.serviceId,
            queueId: item.queueId,
            name: item.name,
            icon: item.icon,
            price: item.price,
            finalDuration: item.finalDuration,
            finalPrice: item.finalPrice,
            quantity: item.quantity,
            variablePrice: item.variablePrice,
            variableTime: item.variableTime,
          })),
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
      return this.activeOrders.filter(order => order.status === 6);
    } else if (this.filter === 'highPriority') {
      return this.activeOrders.filter(order => order.priority === 0);
    } else if (this.filter === 'history') {
      return [...this.processedOrders]
        //   .sort((a, b) => (b.processedAt) - (a.processedAt || 0))
        .slice(0, 5);
    }
    return this.activeOrders;
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
            await this.processOrder(order, CustomerStatusEnum.Approved, 'Pedido aprovado!');
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
