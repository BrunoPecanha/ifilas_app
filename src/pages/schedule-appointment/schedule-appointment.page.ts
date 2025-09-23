import { Component, OnInit } from '@angular/core';
import { AvailableDateModel } from 'src/models/available-date-model';
import { TimeSlotModel } from 'src/models/time-slot-model';


@Component({
  selector: 'app-schedule-appointment',
  templateUrl: './schedule-appointment.page.html',
  styleUrls: ['./schedule-appointment.page.scss'],
})
export class ScheduleAppointmentPage implements OnInit {
   defaultLogo = 'assets/images/store.png';

 selectedStore: any = {
    name: 'Loja Exemplo',
    address: 'Rua Central, 123',
    image: 'https://yidudaduvasngangrydi.supabase.co/storage/v1/object/public/uploads/logo/5721731e-0301-45df-9799-aed397233717.jpeg',
  };

  availableDates: AvailableDateModel[] = [];
  selectedDate: Date | null = null;
  selectedTimeSlots: TimeSlotModel[] = [];

  daysWindow = 15;

  ngOnInit() {
    this.generateAvailableDates();
  }

  private generateAvailableDates() {
    const today = new Date();

    for (let i = 0; i < this.daysWindow; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);

      const available = Math.random() > 0.2; 
      this.availableDates.push({
        date,
        available,
        timeSlots: available ? this.generateTimeSlots(date) : [],
      });
    }
  }

  private generateTimeSlots(date: Date): TimeSlotModel[] {
    const slots: TimeSlotModel[] = [];
    const startHour = 8;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${minute
            .toString()
            .padStart(2, '0')}`,
          available: Math.random() > 0.3, 
        });
      }
    }
    return slots;
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
