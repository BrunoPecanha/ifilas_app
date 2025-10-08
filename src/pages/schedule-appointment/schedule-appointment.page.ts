import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AvailableDateModel } from 'src/models/available-date-model';
import { TimeSlotModel } from 'src/models/time-slot-model';
import { ScheduleService } from 'src/services/schedule.service';
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
  selectedDate: Date | null = null;
  selectedTimeSlots: TimeSlotModel[] = [];
  daysWindow = 7;
  storeId: number = 0;
  professionalId: number = 0;

  constructor(private service: ScheduleService,
    private alertController: AlertController,
    private toastService: ToastService,
    private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.storeId = params['storeId'];
      this.professionalId = params['professionalId'];

      this.getSelectedStoreIdAndProfessional();
      this.loadStoreAgenda();
    });
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

  getSelectedStoreIdAndProfessional() {
    this.route.queryParams.subscribe(params => {
      this.storeId = params['storeId'];
      this.professionalId = params['professionalId'];
    });
  }

  public async selectTimeSlot(slot: TimeSlotModel): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Agendamento',
      message: this.formatDate(this.selectedDate!) + ' às ' + slot.time + '?',
      buttons: [
        {
          text: 'Cancelar', role: 'cancel'},        
        {
          text: 'Confirmar',
          //   handler: async () => {
          //     this.queueService.exitQueue(card.id, card.queueId).subscribe({
          //       next: async () => {
          //         await this.toastService.show('Você saiu da fila com sucesso!', 'success');
          //         // this.loadCustomersInQueueCard();
          //       },
          //       error: async (err) => {
          //         console.error('Erro ao sair da fila:', err);
          //         await await this.toastService.show('Ocorreu um erro ao sair da fila', 'danger');
          //       }
          //     });
          //   },
        }
      ]
    });
    await alert.present();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  }
}
