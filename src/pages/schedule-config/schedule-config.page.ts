import { Component } from '@angular/core';
import { ScheduleCreateRequest } from 'src/models/requests/schedule-create-request';
import { ScheduleService } from 'src/services/schedule.service';
import { WeekDayConfigRequest } from 'src/models/requests/weekday-config-request';
import { ExceptionConfigRequest } from 'src/models/requests/exception-config-request';
import { ToastService } from 'src/services/toast.service';

@Component({
  selector: 'app-schedule-config',
  templateUrl: './schedule-config.page.html',
  styleUrls: ['./schedule-config.page.scss'],
})
export class ScheduleConfigPage {
  activeTab: 'week' | 'exceptions' = 'week';
  description: string = '';

  weekDays: WeekDayConfigRequest[] = [
    { dayOfWeek: 1, label: 'Segunda-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 2, label: 'Terça-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 3, label: 'Quarta-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 4, label: 'Quinta-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 5, label: 'Sexta-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 6, label: 'Sábado', enabled: false, startTime: null, endTime: null },
    { dayOfWeek: 0, label: 'Domingo', enabled: false, startTime: null, endTime: null },
  ];

  exceptions: ExceptionConfigRequest[] = [];
  exceptionDate: string | null = null;
  exceptionStart: string | null = null;
  exceptionEnd: string | null = null;
  exceptionReason: string = '';
  fullDayClosed: boolean = false;

  constructor(private scheduleService: ScheduleService, private toastService: ToastService) {
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
      storeId: 1,
      employeeId: 1,
      description: this.description || 'Agenda configurada',
      date: new Date().toISOString().split('T')[0],
      openingTime: '09:00',
      closingTime: '18:00',
      type: 'normal',
      eligibleGroups: [],
      maxServiceTime: 60,
      isRecurring: true,
      recurringDays: this.weekDays.filter(d => d.enabled).map(d => d.dayOfWeek),
      recurringEndDate: null,
      weekDays: this.weekDays.map(d => ({
        dayOfWeek: d.dayOfWeek,
        enabled: d.enabled,
        label: d.label,
        startTime: this.normalizeTime(d.startTime),
        endTime: this.normalizeTime(d.endTime),
      })),
      exceptions: this.exceptions.map(e => ({
        reason: e.reason,
        date: e.date,
        start: this.normalizeTime(e.start),
        end: this.normalizeTime(e.end),
        fullDayClosed: e.fullDayClosed,
      })),
    };

    this.scheduleService.createSchedule(payload).subscribe({
      next: () => alert('Configuração salva com sucesso!'),
      error: (err) => {
        alert('Erro ao salvar configuração.');
        console.error(err);
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