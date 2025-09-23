import { Component, OnInit } from '@angular/core';

interface AvailableDate {
  date: Date;
  available: boolean;
  timeSlots: TimeSlot[];
}

interface TimeSlot {
  time: string;
  available: boolean;
}

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

  availableDates: AvailableDate[] = [];
  selectedDate: Date | null = null;
  selectedTimeSlots: TimeSlot[] = [];

  // Parametrização da janela (7, 15 ou 30)
  daysWindow = 15;

  ngOnInit() {
    this.generateAvailableDates();
  }

  private generateAvailableDates() {
    const today = new Date();

    for (let i = 0; i < this.daysWindow; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);

      const available = Math.random() > 0.2; // simulação
      this.availableDates.push({
        date,
        available,
        timeSlots: available ? this.generateTimeSlots(date) : [],
      });
    }
  }

  private generateTimeSlots(date: Date): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${minute
            .toString()
            .padStart(2, '0')}`,
          available: Math.random() > 0.3, // simulação
        });
      }
    }
    return slots;
  }

  selectDate(day: AvailableDate) {
    if (!day.available) return;
    this.selectedDate = day.date;
    this.selectedTimeSlots = day.timeSlots;
  }

  selectTimeSlot(slot: TimeSlot) {
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
