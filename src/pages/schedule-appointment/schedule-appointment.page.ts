import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AvailableDateModel } from 'src/models/available-date-model';
import { StoreModel } from 'src/models/store-model';
import { TimeSlotModel } from 'src/models/time-slot-model';
import { UserModel } from 'src/models/user-model';
import { ScheduleService } from 'src/services/schedule.service';
import { SessionService } from 'src/services/session.service';

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

  constructor(private service: ScheduleService, private sessionService: SessionService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.getSelectedStoreIdAndProfessional();
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

  getSelectedStoreIdAndProfessional() {
    this.route.queryParams.subscribe(params => {
      this.storeId = params['storeId'];
      this.professionalId = params['professionalId'];
    });
  }

  selectTimeSlot(slot: TimeSlotModel) {
    console.log('Horário escolhido:', slot.time, 'em', this.selectedDate);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  }
}
