import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { AlertController, IonModal, ModalController } from '@ionic/angular';
import { StoreModel } from 'src/models/store-model';
import { ScheduleService } from 'src/services/schedule.service';
import { ServiceService } from 'src/services/services.service';
import { SessionService } from 'src/services/session.service';
import { ToastService } from 'src/services/toast.service';

@Component({
  selector: 'app-edit-service',
  templateUrl: './edit-service-modal.component.html',
  styleUrls: ['./edit-service-modal.component.scss'],
})
export class EditServiceComponent implements OnInit {

  @ViewChild('dateModal') dateModal!: IonModal;
  @ViewChild('timeModal') timeModal!: IonModal;
  @Input() customer: any;
  @Input() services: any[] = [];
  @Input() selectedDate!: Date;

  editableDate!: string;
  editableTime!: string;
  isDateModalOpen = false;
  isTimeModalOpen = false;
  scheduleId: number = 0;
  store: StoreModel;
  serviceOptions: any[] = [];

  constructor(
    private modalController: ModalController,
    private toastController: ToastService,
    private sessionService: SessionService,
    private serviceService: ServiceService,
    private alertController: AlertController,
    private scheduleService: ScheduleService) {
    this.store = this.sessionService.getStore();
  }

  ngOnInit() {
    this.editableDate = this.toDateOnly(this.selectedDate);
    this.editableTime = this.customer?.slotStart || '08:00';

    this.services = (this.services || []).map((s: any) => ({
      id: s.serviceId || s.id,
      name: s.name,
      duration: s.finalDuration || s.duration || 0,
      price: s.finalPrice || s.price || 0,
      quantity: s.quantity || 1
    }));

    this.loadAvailablesServices();
  }

  loadAvailablesServices() {
    if (this.store) {
      this.serviceService.loadServicesByStore(this.store.id, true).subscribe({
        next: (response) => {
          const selectedServices = this.services || [];

          this.serviceOptions = response.data.map((service: any) => {
            const selected = selectedServices.find(
              x => x.id === service.id
            );

            return {
              id: service.id,
              name: service.name,
              duration: service.duration || 0,
              price: service.price || 0,
              quantity: selected?.quantity || 0
            };
          });
        },
        error: (err) => {
          this.toastController.show(
            'Erro ao carregar serviços do estabelecimento:',
            'danger'
          );
        }
      });

    } else {
      this.toastController.show(
        'Não foi possível carregar os serviços/produtos da loja.',
        'danger'
      );
    }
  }

  private toDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onDateChange(event: any) {
    this.editableDate = event.detail.value.split('T')[0];
    this.setDateModalOpen(false);
  }

  onTimeChange(event: any) {
    this.editableTime = event.detail.value;
  }

  get totalItems() {
    return this.serviceOptions
      .filter((s: any) => s.quantity > 0)
      .reduce((acc: number, s: any) => acc + s.quantity, 0);
  }

  get totalPrice() {
    return this.serviceOptions.reduce(
      (acc: number, s: any) => acc + (s.price * s.quantity),
      0
    );
  }

  get formattedDate(): string {
    if (!this.selectedDate)
      return '';
    return this.selectedDate.toLocaleDateString('pt-BR');
  }

  get formattedTime(): string {
    return this.customer?.slotStart || '--:--';
  }

  add(service: any) {
    service.quantity++;
  }

  remove(service: any) {
    if (service.quantity > 0) {
      service.quantity--;
    }
  }

  async close() {
    await this.modalController.dismiss();
  }

  async save() {
    const selectedServices = this.serviceOptions
      .filter(s => s.quantity > 0);

    const command = {
      customerId: this.customer.id,
      date: this.editableDate,
      startTime: `${this.editableTime}:00`,
      services: selectedServices.map(service => ({
        serviceId: service.id,
        quantity: service.quantity
      }))
    };

    this.scheduleService.checkIfHasConflict(command).subscribe({
      next: async (response) => {
        if (response.data) {
          const conflictCustomer = response.data;          
          const customerName = conflictCustomer.customer.randomCustomerName || conflictCustomer.customer.user.name || 'outro cliente';
          const conflictTime = conflictCustomer.startTime?.substring(0, 5) || '--:--';

          const alert = await this.alertController.create({
            header: 'Conflito de horário',
            message:
              `Esse atendimento pode conflitar com o agendamento de ${customerName} às ${conflictTime}, ultrapassando o horário disponível. Deseja continuar mesmo assim?`,
            buttons: [
              {
                text: 'Cancelar',
                role: 'cancel'
              },
              {
                text: 'Continuar',
                handler: async () => {
                  await this.dismissModal(selectedServices, true);
                }
              }
            ]
          });

          await alert.present();
          return;
        }

        await this.dismissModal(selectedServices, false);
      },

      error: async (err) => {
        console.error(err);

        this.toastController.show(
          'Erro ao validar conflito de horário.',
          'danger'
        );
      }
    });
  }

  private async dismissModal(
    selectedServices: any[],
    hasConflict: boolean
  ) {

    await this.modalController.dismiss({
      customerId: this.customer.id,
      services: selectedServices.map(x => ({
        id: x.id,
        quantity: x.quantity
      })),
      newDate: this.editableDate,
      newTime: this.editableTime,
      hasConflict: hasConflict
    });
  }

  openTimeModal() {
    this.isTimeModalOpen = true;
  }

  openDateModal() {
    this.isDateModalOpen = true;
  }

  confirmTime() {
    this.setTimeModalOpen(false);
  }

  setDateModalOpen(isOpen: boolean) {
    this.isDateModalOpen = isOpen;
  }

  setTimeModalOpen(isOpen: boolean) {
    this.isTimeModalOpen = isOpen;
  }
}