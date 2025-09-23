import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AvailableDateModel } from 'src/models/available-date-model';
import { TimeSlotModel } from 'src/models/time-slot-model';
import { ScheduleDateModel } from 'src/models/schedule-date-model';

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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadStoreAgenda();
  }

  loadStoreAgenda() {
    this.http.get<ScheduleDateModel>('api/store/1/agenda').subscribe(res => {
      this.selectedStore = res.store;
      this.daysWindow = res.daysWindow;
      this.availableDates = res.availableDates.map(d => ({
        ...d,
        date: new Date(d.date)
      }));
    });
  }

  selectDate(day: AvailableDateModel) {
    if (!day.available) return;
    this.selectedDate = day.date;
    this.selectedTimeSlots = day.timeSlots;
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
