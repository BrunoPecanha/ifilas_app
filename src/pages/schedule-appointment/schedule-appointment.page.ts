import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StatusQueueEnum } from 'src/models/enums/status-queue.enum';

interface AvailableDate {
  date: Date;
  available: boolean;
  timeSlots: TimeSlot[];
}

interface TimeSlot {
  time: string;
  available: boolean;
  maxCapacity: number;
  currentBookings: number;
}

@Component({
  selector: 'app-schedule-appointment',
  templateUrl: './schedule-appointment.page.html',
  styleUrls: ['./schedule-appointment.page.scss'],
})
export class ScheduleAppointmentPage implements OnInit {
  selectedStore: any;
  availableDates: AvailableDate[] = [];
  selectedDate: Date | null = null;
  selectedTimeSlots: TimeSlot[] = [];
  storeId: number = 0;

  minDate!: string;
  maxDate!: string;

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    this.initDates();
    this.loadAvailableDates();
  }

  private initDates() {
    const today = new Date();
    this.minDate = today.toISOString();

    const max = new Date();
    max.setDate(today.getDate() + 30);
    this.maxDate = max.toISOString();
  }

  private loadAvailableDates() {
    const today = new Date();
    this.availableDates = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);

      this.availableDates.push({
        date,
        available: Math.random() > 0.3,
        timeSlots: this.generateTimeSlots(date),
      });
    }
  }

  getSelectedStoreId() {
    this.route.queryParams.subscribe(params => {
      this.storeId = params['storeId'];
    });
  }

  getStatusClass(status: StatusQueueEnum): string {
    switch (status) {
      case StatusQueueEnum.open:
        return 'open';
      case StatusQueueEnum.paused:
        return 'paused';
      case StatusQueueEnum.closed:
        return 'closed';
      default:
        return '';
    }
  }

  private generateTimeSlots(date: Date): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    const startHour = isWeekend ? 9 : 8;
    const endHour = isWeekend ? 17 : 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const available = Math.random() > 0.4;
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${minute
            .toString()
            .padStart(2, '0')}`,
          available,
          maxCapacity: 5,
          currentBookings: available ? Math.floor(Math.random() * 4) : 5,
        });
      }
    }

    return slots;
  }

  isDateAvailable(date: Date): boolean {
    const foundDate = this.availableDates.find(
      (d) => d.date.toDateString() === date.toDateString()
    );
    return foundDate ? foundDate.available : false;
  }

  onDateSelected(event: any) {
    const selectedDate = new Date(event.detail.value);
    this.selectedDate = selectedDate;

    const selectedDateData = this.availableDates.find(
      (d) => d.date.toDateString() === selectedDate.toDateString()
    );

    this.selectedTimeSlots = selectedDateData?.timeSlots || [];
  }

  selectTimeSlot(slot: TimeSlot) {
    if (slot.available) {
      console.log('Horário escolhido:', slot.time);

    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  }
}
