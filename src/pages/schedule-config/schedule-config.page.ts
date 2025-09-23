import { Component, OnInit } from '@angular/core';
import { ScheduleService } from 'src/services/schedule.service';
import { WeekDayConfigRequest } from 'src/models/requests/weekday-config-request';
import { ExceptionConfigRequest } from 'src/models/requests/exception-config-request';
import { ToastService } from 'src/services/toast.service';
import { ScheduleCreateRequest } from 'src/models/requests/schedule-create-request';
import { ExceptionModel, ScheduleModel, WeeklyScheduleModel } from 'src/models/schedule-model';
import { SessionService } from 'src/services/session.service';
import { StoreModel } from 'src/models/store-model';
import { UserModel } from 'src/models/user-model';

@Component({
  selector: 'app-schedule-config',
  templateUrl: './schedule-config.page.html',
  styleUrls: ['./schedule-config.page.scss'],
})
export class ScheduleConfigPage implements OnInit {
  activeTab: 'week' | 'exceptions' = 'week';
  description: string = '';
  schedule!: ScheduleModel;
  user!: UserModel;
  store!: StoreModel;
  slotInterval: number = 30;
  agendaInterval: number = 7;

  weekDays: WeekDayConfigRequest[] = [
    { id: 1, dayOfWeek: 1, label: 'Segunda-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { id: 2, dayOfWeek: 2, label: 'Terça-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { id: 3, dayOfWeek: 3, label: 'Quarta-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { id: 4, dayOfWeek: 4, label: 'Quinta-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { id: 5, dayOfWeek: 5, label: 'Sexta-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { id: 6, dayOfWeek: 6, label: 'Sábado', enabled: false, startTime: null, endTime: null },
    { id: 7, dayOfWeek: 0, label: 'Domingo', enabled: false, startTime: null, endTime: null },
  ];

  exceptions: ExceptionConfigRequest[] = [];
  exceptionDate: string | null = null;
  exceptionStart: string | null = null;
  exceptionEnd: string | null = null;
  exceptionReason: string = '';
  fullDayClosed: boolean = false;

  constructor(
    private scheduleService: ScheduleService,
    private sessionService: SessionService,
    private toastService: ToastService
  ) {
  }

  ngOnInit() {
    this.store = this.sessionService.getStore();
    this.user = this.sessionService.getUser()!;
    this.loadSchedule();
  }

  private normalizeTime(value: string | null): string | null {
    if (!value)
      return null;

    const isoMatch = value.match(/T(\d{2}):(\d{2})/);
    if (isoMatch)
      return `${isoMatch[1]}:${isoMatch[2]}:00`;

    const hhmmMatch = value.match(/^(\d{2}):(\d{2})/);
    if (hhmmMatch)
      return `${hhmmMatch[1]}:${hhmmMatch[2]}:00`;

    return null;
  }

  private loadSchedule() {
    this.scheduleService.getSchedule(this.store.id, this.user.id).subscribe({
      next: (res) => {
        if (res.valid && res.data) {
          this.schedule = res.data;
          this.slotInterval = this.schedule.slotDurationInMinutes || 30;
          this.agendaInterval = this.schedule.agendaInterval || 7;

          this.weekDays = this.weekDays.map((wd) => {
            const apiDay = this.schedule?.weeklySchedules.find(
              (d: WeeklyScheduleModel) => d.dayOfWeek === wd.dayOfWeek
            );
            return apiDay
              ? {
                ...wd,
                id: apiDay.id,
                enabled: apiDay.enabled,
                startTime: apiDay.startTime
                  ? apiDay.startTime.substring(0, 5)
                  : null,
                endTime: apiDay.endTime
                  ? apiDay.endTime.substring(0, 5)
                  : null,
              }
              : wd;
          });

          this.exceptions = this.schedule?.exceptions.map((ex: ExceptionModel) => ({
            id: ex.id,
            date: ex.date,
            start: ex.startTime,
            end: ex.endTime,
            fullDayClosed: ex.fullDayClosed,
            reason: ex.reason || '',
          }));
        }
      },
      error: () => {
        this.toastService.show('Erro ao carregar agenda', 'danger');
      },
    });
  }

  addException() {
    if (!this.exceptionDate) {
      this.toastService.show('Selecione uma data.', 'warning');
      return;
    }

    if (!this.fullDayClosed && (!this.exceptionStart || !this.exceptionEnd)) {
      this.toastService.show('Preencha o horário ou marque "Dia inteiro fechado".', 'warning');
      return;
    }

    const startTime = this.fullDayClosed ? null : this.normalizeTime(this.exceptionStart);
    const endTime = this.fullDayClosed ? null : this.normalizeTime(this.exceptionEnd);

    this.exceptions.push({
      id: 0,
      reason: this.exceptionReason || '',
      date: this.exceptionDate,
      start: startTime,
      end: endTime,
      fullDayClosed: this.fullDayClosed,
    });

    this.exceptionDate = null;
    this.exceptionStart = null;
    this.exceptionEnd = null;
    this.exceptionReason = '';
    this.fullDayClosed = false;
  }

  removeException(index: number) {
    this.exceptions.splice(index, 1);
  }

  save() {

    const payload: ScheduleCreateRequest = {
      storeId: this.store.id,
      employeeId: this.user.id,
      description: this.description || 'Agenda configurada',
      date: new Date().toISOString().split('T')[0],
      openingTime: '09:00',
      closingTime: '18:00',
      type: 'normal',
      eligibleGroups: [],
      slotDurationMinutes: this.slotInterval,
      agendaInterval: this.agendaInterval,
      isRecurring: true,
      recurringDays: this.weekDays.filter(d => d.enabled).map(d => d.dayOfWeek),
      recurringEndDate: null,

      weekDays: this.weekDays.map(d => ({
        id: d.id || 0,
        dayOfWeek: d.dayOfWeek,
        enabled: d.enabled,
        label: d.label,
        startTime: this.normalizeTime(d.startTime),
        endTime: this.normalizeTime(d.endTime),
      })),

      exceptions: this.exceptions
        .filter(e => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
        .map(e => ({
          id: e.id || 0,
          reason: e.reason,
          date: e.date,
          start: this.normalizeTime(e.start),
          end: this.normalizeTime(e.end),
          fullDayClosed: e.fullDayClosed,
        }))
    };   
    
    const request$ = this.schedule?.id
      ? this.scheduleService.updateSchedule(this.schedule?.id, payload)
      : this.scheduleService.createSchedule(payload);

    request$.subscribe({
      next: () => {
        const action = this.schedule?.id ? 'atualizada' : 'criada';
        this.toastService.show(`Configuração ${action} com sucesso!`, 'success');
      },
      error: (err) => {
        console.error('Erro ao salvar configuração:', err);
        const msg = err?.error?.message || 'Erro ao salvar configuração.';
        this.toastService.show(msg, 'danger');
      },
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
    });
  }
}