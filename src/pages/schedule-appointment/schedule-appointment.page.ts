import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AvailableDateModel } from 'src/models/available-date-model';
import { TimeSlotModel } from 'src/models/time-slot-model';
import { ScheduleService } from 'src/services/schedule.service';

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

  constructor(private service: ScheduleService) { 
  }

  ngOnInit() {
    this.loadStoreAgenda();
  }

  loadStoreAgenda() {
    this.service.getEmployeeAgendaForCostumers(1, 1, new Date()).subscribe(res => {      
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
