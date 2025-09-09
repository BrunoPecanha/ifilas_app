import { Component } from '@angular/core';

interface WeekDayConfig {
  label: string;
  enabled: boolean;
  startTime: string | null;
  endTime: string | null;
}

interface ExceptionConfig {
  date: string;
  start: string | null;
  end: string | null;
  fullDayClosed: boolean;
}

@Component({
  selector: 'app-schedule-config',
  templateUrl: './schedule-config.page.html',
  styleUrls: ['./schedule-config.page.scss'],
})
export class ScheduleConfigPage {
  activeTab: 'week' | 'exceptions' = 'week';

  weekDays: WeekDayConfig[] = [
    { label: 'Segunda-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { label: 'Terça-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { label: 'Quarta-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { label: 'Quinta-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { label: 'Sexta-feira', enabled: true, startTime: '09:00', endTime: '18:00' },
    { label: 'Sábado', enabled: false, startTime: null, endTime: null },
    { label: 'Domingo', enabled: false, startTime: null, endTime: null },
  ];

  exceptions: ExceptionConfig[] = [];

  exceptionDate: string | null = null;
  exceptionStart: string | null = null;
  exceptionEnd: string | null = null;
  fullDayClosed: boolean = false;

  constructor() {}

  addException() {
    if (!this.exceptionDate) {
      alert('Selecione uma data.');
      return;
    }

    if (!this.fullDayClosed && (!this.exceptionStart || !this.exceptionEnd)) {
      alert('Preencha o horário ou marque "Dia inteiro fechado".');
      return;
    }

    this.exceptions.push({
      date: this.exceptionDate,
      start: this.fullDayClosed ? null : this.exceptionStart,
      end: this.fullDayClosed ? null : this.exceptionEnd,
      fullDayClosed: this.fullDayClosed
    });

    this.exceptionDate = null;
    this.exceptionStart = null;
    this.exceptionEnd = null;
    this.fullDayClosed = false;
  }

  removeException(index: number) {
    this.exceptions.splice(index, 1);
  }

  save() {
    const payload = {
      weekDays: this.weekDays.map(d => ({
        label: d.label,
        enabled: d.enabled,
        startTime: d.enabled ? d.startTime : null,
        endTime: d.enabled ? d.endTime : null
      })),
      exceptions: this.exceptions
    };

    console.log('Configuração salva:', payload);
    alert('Configuração salva com sucesso!');
    
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
