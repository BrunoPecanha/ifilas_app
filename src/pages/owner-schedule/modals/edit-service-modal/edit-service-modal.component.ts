import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { IonModal, ModalController } from '@ionic/angular';

interface Service {
  id: number;
  name: string;
  duration: string;
  price: number;
  quantity: number;
}

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

  constructor(
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.editableDate = this.toDateOnly(this.selectedDate);
    this.editableTime = this.customer?.slotStart || '08:00';

    this.services = (this.services || []).map((s: any) => ({
      id: s.serviceId || s.id,
      name: s.name,
      duration: this.formatDuration(
        s.finalDuration || s.duration || 0
      ),
      price: s.finalPrice || s.price || 0,
      quantity: s.quantity || 1
    }));
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
    return this.services.filter((s: any) => s.quantity > 0).length;
  }

  get totalPrice() {
    return this.services.reduce(
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
    await this.modalController.dismiss({
      customerId: this.customer.id,
      services: this.services,
      selectedDate: this.editableDate,
      slotStart: this.editableTime
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

  private formatDuration(minutes: number): string {
    if (!minutes)
      return '0min';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0)
      return `${h}h${m}min`;
    if (h > 0)
      return `${h}h`;
    return `${m}min`;
  }
}