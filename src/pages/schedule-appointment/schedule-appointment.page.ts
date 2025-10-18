import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AvailableDateModel } from 'src/models/available-date-model';
import { AddCustomerToScheduleRequest } from 'src/models/requests/add-customer-to-schedule-request copy';
import { AddServiceRequest } from 'src/models/requests/add-service-request';
import { TimeSlotModel } from 'src/models/time-slot-model';
import { UserModel } from 'src/models/user-model';
import { ScheduleService } from 'src/services/schedule.service';
import { SessionService } from 'src/services/session.service';
import { ToastService } from 'src/services/toast.service';

@Component({
  selector: 'app-schedule-appointment',
  templateUrl: './schedule-appointment.page.html',
  styleUrls: ['./schedule-appointment.page.scss'],
})
export class ScheduleAppointmentPage implements OnInit {
  defaultLogo = 'assets/images/store.png';

  selectedStore: any;
  availableDates: AvailableDateModel[] = [];
  selectedTimeSlots: TimeSlotModel[] = [];
  daysWindow = 7;

  selectedServices: AddServiceRequest[] = [];
  notes: string = '';
  paymentMethod: number = 1;
  storeId: number = 0;
  professionalId: number = 0;
  selectedDate: Date | null = null;
  looseCustomer: boolean = false;
  customer!: UserModel;

  constructor(private service: ScheduleService,
    private alertController: AlertController,
    private toastService: ToastService,
    private router: Router,
    private sessionService: SessionService) {
  }

  ngOnInit() {
    const msg = sessionStorage.getItem('toastMessage');

    if (msg) {
      this.toastService.show(msg, 'danger');
      sessionStorage.removeItem('toastMessage');
    }

    this.selectedServices = this.sessionService.getGenericKey('selectedServices') || [];
    this.notes = this.sessionService.getGenericKey('notes') || '';
    this.paymentMethod = this.sessionService.getGenericKey('paymentMethod') || '1';
    this.storeId = this.sessionService.getGenericKey('storeId') || 0;
    this.professionalId = this.sessionService.getGenericKey('professionalId') || 0;

    this.customer = this.sessionService.getUser();
    this.loadStoreAgenda();
  }

  loadStoreAgenda() {
    this.service.getEmployeeAgendaForCostumers(this.storeId, this.professionalId, new Date()).subscribe(res => {
      this.selectedStore = res.data.store;
      this.daysWindow = res.data.daysWindow;
      this.availableDates = res.data.availableDates.map(d => ({
        ...d,
        date: new Date(d.date)
      }));
    });
  }

  selectDate(day: AvailableDateModel) {
    if (!day.available)
      return;

    this.selectedDate = day.date;
    this.selectedTimeSlots = day.timeSlots;
  }

  public async selectTimeSlot(slot: TimeSlotModel): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Agendamento',
      message: `${this.formatDate(this.selectedDate!)} às ${slot.time}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: async () => {
            if (!this.selectedDate) {
              await this.toastService.show('Data não selecionada', 'danger');
              return;
            }
            
            const request: AddCustomerToScheduleRequest = {
              selectedServices: this.selectedServices,
              notes: this.notes ?? '',
              paymentMethod: this.paymentMethod,
              storeId: this.storeId,
              scheduleId: 0,
              professionalId: this.professionalId,
              time: slot.time,
              date: this.selectedDate,
              customerId: this.customer.id,
              looseCustomer: this.looseCustomer
            };

            this.service.addCustomerToSchedule(request).subscribe({
              next: async (res) => {
                if (res.valid) {
                  await this.toastService.show('Agendamento realizado com sucesso!', 'success');
                  this.clearSessionDate();
                  this.router.navigate(['/queue']);
                } else {
                  await this.toastService.show(res.message || 'Erro ao agendar', 'danger');
                }
              },
              error: async (err) => {
                sessionStorage.setItem('toastMessage', err.error || 'Erro ao agendar');
                window.location.reload();
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  clearSessionDate() {
    this.sessionService.removeGenericKey('selectedServices');
    this.sessionService.removeGenericKey('notes');
    this.sessionService.removeGenericKey('paymentMethod');
    this.sessionService.removeGenericKey('storeId');
    this.sessionService.removeGenericKey('professionalId');
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  }
}
