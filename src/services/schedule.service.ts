import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { QueueCloseRequest } from 'src/models/requests/queue-close-request';
import { ScheduleCreateRequest } from 'src/models/requests/schedule-create-request';
import { ScheduleResponse } from 'src/models/responses/schedule-response';
import { ScheduleDateResponse } from 'src/models/responses/schedule-date-response';
import { AddCustomerToScheduleRequest } from 'src/models/requests/add-customer-to-schedule-request copy';
import { ScheduleItem } from 'src/models/responses/dashboard-response';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  constructor(private http: HttpClient) { }

  private apiUrl = environment.apiUrl + '/schedule';

  addCustomerToSchedule(command: AddCustomerToScheduleRequest): Observable<ScheduleResponse> {
    return this.http.post<any>(`${this.apiUrl}/addCustomer`, command).pipe(
      catchError(error => {
        console.error('Erro ao adicionar cliente à fila:', error);
        return throwError(() => error);
      })
    );
  }

  getCustomerScheduleForDay(customerId: number, date: Date): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/next-day/${customerId}/${date.toISOString()}`);
  }

  updateCustomerName(customerId: number, newName: string) {
    return this.http.patch(`${this.apiUrl}/${customerId}/name`, { name: newName });
  }

  updateSchedule(scheduleId: number, command: ScheduleCreateRequest): Observable<ScheduleResponse> {
    return this.http.put<ScheduleResponse>(`${this.apiUrl}/${scheduleId}`, command).pipe(
      catchError(error => {
        console.error('Erro ao alterar a agenda:', error);
        return throwError(() => error);
      })
    );
  }

  leavaSchedule(custeomerId: number, scheduleId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${custeomerId}/${scheduleId}/leave`);
  }

  createSchedule(command: ScheduleCreateRequest): Observable<ScheduleResponse> {
    return this.http.post<ScheduleResponse>(`${this.apiUrl}`, command).pipe(
      catchError(error => {
        console.error('Erro ao criar a fila:', error);
        return throwError(() => error);
      })
    );
  }

  closeQueue(command: QueueCloseRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}close`, command).pipe(
      catchError(error => {
        console.error('Erro ao encerrar a fila:', error);
        return throwError(() => error);
      })
    );
  }

  getSchedule(storeId: number, employeeId: number): Observable<ScheduleResponse> {
    return this.http.get<ScheduleResponse>(`${this.apiUrl}/${storeId}/${employeeId}`);
  }

  getEmployeeAgendaForCostumers(storeId: number, employeeId: number, date: Date): Observable<ScheduleDateResponse> {
    return this.http.get<ScheduleDateResponse>(`${this.apiUrl}/agenda/${employeeId}/${storeId}/${date.toISOString()}`);
  }
}