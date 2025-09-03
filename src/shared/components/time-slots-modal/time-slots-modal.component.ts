import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-time-slots-modal',
  templateUrl: './time-slots-modal.component.html',
  styleUrls: ['./time-slots-modal.component.scss'],
})
export class TimeSlotsModalComponent {
  @Input() date!: Date;
  @Input() timeSlots: any[] = [];
  @Input() store: any;

  constructor(private modalCtrl: ModalController) {}

  selectTimeSlot(timeSlot: any) {
    if (timeSlot.available && timeSlot.currentBookings < timeSlot.maxCapacity) {
      this.modalCtrl.dismiss({
        selectedTime: timeSlot.time
      });
    }
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  }
}