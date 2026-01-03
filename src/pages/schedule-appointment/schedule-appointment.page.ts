import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonContent } from '@ionic/angular';
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
export class ScheduleAppointmentPage implements OnInit, AfterViewInit {
  @ViewChild(IonContent) content!: IonContent;

  defaultLogo = 'assets/images/store.png';
  headerScrolled = false;
  selectedStore: any;
  availableDates: AvailableDateModel[] = [];
  selectedTimeSlots: TimeSlotModel[] = [];
  daysWindow = 7;

  selectedServices: AddServiceRequest[] = [];
  notes: string = '';
  paymentMethod: number = 1;
  storeId: number = 0;
  customerId: number = 0;
  professionalId: number = 0;
  selectedDate: Date | null = null;
  looseCustomer: boolean = false;
  looseCustomerName: string = '';
  customerOrProfessional!: UserModel;
  redirectToCustomerDashBoard: boolean = true;

  selectedTimeSlot: TimeSlotModel | null = null;
  currentWeekOffset: number = 0;
  visibleDates: AvailableDateModel[] = [];

  constructor(
    private service: ScheduleService,
    private alertController: AlertController,
    private toastService: ToastService,
    private router: Router,
    private sessionService: SessionService
  ) { }

  ngOnInit() {
    this.setupScrollListener();
    const msg = sessionStorage.getItem('toastMessage');

    if (msg) {
      this.toastService.show(msg, 'danger');
      sessionStorage.removeItem('toastMessage');
    }

    this.customerOrProfessional = this.sessionService.getUser();
    this.customerId = this.sessionService.getGenericKey('customerId');

    this.selectedServices = this.sessionService.getGenericKey('selectedServices') || [];
    this.notes = this.sessionService.getGenericKey('notes') || '';
    this.paymentMethod = this.sessionService.getGenericKey('paymentMethod') || 1;
    this.looseCustomerName = this.sessionService.getGenericKey('looseCustomerName') || '';
    this.storeId = this.sessionService.getGenericKey('storeId') || 0;
    this.professionalId = this.sessionService.getGenericKey('professionalId') || this.customerOrProfessional.id;
    this.looseCustomer = this.sessionService.getGenericKey('looseCustomer') || this.sessionService.getGenericKey('isWalkIn') || false;
    this.redirectToCustomerDashBoard = this.looseCustomer ? true : false;

    if (!this.customerId) {
      this.customerId = this.sessionService.getUser().id;
    }
    else
      this.looseCustomer = false;

    this.loadStoreAgenda();
  }

  ngAfterViewInit() {
    this.content.scrollEvents = true;
    this.content.ionScroll.subscribe((event: any) => {
      this.headerScrolled = event.detail.scrollTop > 10;
    });
  }

  loadStoreAgenda() {
    this.service.getEmployeeAgendaForCostumers(this.storeId, this.professionalId, new Date().toISOString().substring(0, 10)).subscribe(res => {
      this.selectedStore = res.data.store;
      this.daysWindow = res.data.daysWindow;
      this.availableDates = res.data.availableDates.map((d: any) => {
        const [year, month, day] = d.date.split('T')[0].split('-').map(Number);

        return {
          ...d,
          date: new Date(year, month - 1, day)
        };
      });
      this.updateVisibleDates();
    });
  }

  updateVisibleDates() {
    if (this.availableDates.length === 0) {
      this.visibleDates = [];
      return;
    }

    const startIndex = this.currentWeekOffset * 7;
    this.visibleDates = this.availableDates.slice(startIndex, startIndex + 7);

    while (this.visibleDates.length < 7) {
      this.visibleDates.push({
        date: new Date(),
        available: false,
        timeSlots: []
      });
    }
  }

  setupScrollListener() {
    const content = document.querySelector('ion-content');
    if (content) {
      content.addEventListener('ionScroll', (event: any) => {
        this.headerScrolled = event.detail.scrollTop > 10;
      });
    }
  }

  nextWeek() {
    if (this.canNavigateNext()) {
      this.currentWeekOffset++;
      this.updateVisibleDates();
      this.selectedDate = null;
      this.selectedTimeSlots = [];
      this.selectedTimeSlot = null;
    }
  }

  previousWeek() {
    if (this.canNavigatePrevious()) {
      this.currentWeekOffset--;
      this.updateVisibleDates();
      this.selectedDate = null;
      this.selectedTimeSlots = [];
      this.selectedTimeSlot = null;
    }
  }

  canNavigateNext(): boolean {
    const startIndex = (this.currentWeekOffset + 1) * 7;
    return startIndex < this.availableDates.length;
  }

  canNavigatePrevious(): boolean {
    return this.currentWeekOffset > 0;
  }

  getCurrentWeekRange(): string {
    if (this.visibleDates.length === 0 || !this.visibleDates[0].available)
      return 'Sem datas';

    const firstDate = this.visibleDates[0].date;
    const lastDate = this.visibleDates[this.visibleDates.length - 1].date;

    return `${firstDate.getDate()} ${firstDate.toLocaleDateString('pt-BR', { month: 'short' })} - ${lastDate.getDate()} ${lastDate.toLocaleDateString('pt-BR', { month: 'short' })}`;
  }

  selectDate(day: AvailableDateModel) {
    if (!day.available) return;

    this.selectedDate = day.date;
    this.selectedTimeSlots = day.timeSlots;
    this.selectedTimeSlot = null;
  }

  selectTimeSlot(slot: TimeSlotModel) {
    if (!slot.available)
      return;

    this.selectedTimeSlot = slot;
  }

  isTimeSlotSelected(slot: TimeSlotModel): boolean {
    return this.selectedTimeSlot?.time === slot.time;
  }

  groupTimeSlotsByPeriod(): any[] {
    if (!this.selectedTimeSlots || this.selectedTimeSlots.length === 0)
      return [];

    const morning = this.selectedTimeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour < 12;
    });

    const afternoon = this.selectedTimeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour >= 12 && hour < 18;
    });

    const evening = this.selectedTimeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour >= 18;
    });

    const periods = [];

    if (morning.length > 0)
      periods.push({ period: 'Manhã', slots: morning });
    if (afternoon.length > 0)
      periods.push({ period: 'Tarde', slots: afternoon });
    if (evening.length > 0)
      periods.push({ period: 'Noite', slots: evening });

    return periods;
  }

  async confirmAppointment() {
    if (!this.selectedDate || !this.selectedTimeSlot) {
      await this.toastService.show('Selecione uma data e horário', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Agendamento',
      message: `Deseja confirmar o agendamento para ${this.formatDate(this.selectedDate)} às ${this.selectedTimeSlot.time}?`,
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
              time: this.selectedTimeSlot!.time,
              date: this.selectedDate,
              customerId: this.customerId,
              looseCustomer: this.looseCustomer,
              looseCustomerName: this.looseCustomerName
            };

            this.service.addCustomerToSchedule(request).subscribe({
              next: async (res) => {
                if (res.valid) {
                  await this.toastService.show('Agendamento realizado com sucesso!', 'success');
                  this.clearSessionDate();

                  if (this.redirectToCustomerDashBoard) {
                    this.router.navigate(['/owner-schedule']);
                  }
                  else
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
    this.sessionService.removeGenericKey('looseCustomer');
    this.sessionService.removeGenericKey('looseCustomerName');
    this.sessionService.removeGenericKey('customerId');
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  }
}