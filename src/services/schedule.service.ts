import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { StatusQueueEnum } from 'src/models/enums/status-queue.enum';
import { AddCustomerToQueueRequest } from 'src/models/requests/add-customer-to-queue-request';
import { QueueCloseRequest } from 'src/models/requests/queue-close-request';
import { QueueCreateRequest } from 'src/models/requests/queue-create-request';
import { QueueFilterRequest } from 'src/models/requests/queue-filter-request';
import { QueuePauseRequest } from 'src/models/requests/queue-pause-request';
import { UpdateCustomerToQueueRequest } from 'src/models/requests/update-customer-to-queue-request';
import { CustomerInQueueForEmployeeResponse } from 'src/models/responses/customer-in-queue-for-employee-response';
import { QueueListResponse } from 'src/models/responses/queue-list-response';
import { QueueResponse } from 'src/models/responses/queue-response';
import { ScheduleCreateRequest } from 'src/models/requests/schedule-create-request';
import { ScheduleModel } from 'src/models/schedule-model';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  constructor(private http: HttpClient) { }

   private apiUrl = environment.apiUrl + '/schedule';

    addCustomerToSchedule(command: AddCustomerToQueueRequest): Observable<any> {
      return this.http.post<any>(`${this.apiUrl}/addCustomer`, command).pipe(
        catchError(error => {
          console.error('Erro ao adicionar cliente à fila:', error);
          return throwError(() => error);
        })
      );
    }
  
    updateCustomerName(customerId: number, newName: string) {
      return this.http.patch(`${this.apiUrl}/${customerId}/name`, { name: newName });
    }
   
    createSchedule(command: ScheduleCreateRequest): Observable<ScheduleModel> {
      return this.http.post<ScheduleModel>(`${this.apiUrl}`, command).pipe(
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
  
    existCustuomerInQueueWaiting(queueId: number): Observable<boolean> {
      return this.http.get<boolean>(`${this.apiUrl}/${queueId}/waiting`);
    }
  
    deleteQueue(queueId: number): Observable<any> {
      return this.http.delete(`${this.apiUrl}/queue/${queueId}`);
    }
  
    pauseQueue(command: QueuePauseRequest): Observable<QueueResponse> {
      return this.http.put<QueueResponse>(`${this.apiUrl}/queue/pause`, command).pipe(
        catchError(error => {
          console.error('Falha ao pausa a fila:', error);
          return throwError(() => error);
        })
      );
    }
  
    updateQueue(queueId: number, command: QueueCreateRequest): Observable<QueueResponse> {
      return this.http.put<QueueResponse>(`${this.apiUrl}/queue`, command).pipe(
        catchError(error => {
          console.error('Erro ao alterar a fila:', error);
          return throwError(() => error);
        })
      );
    }
  
    updateCustomerToQueue(command: UpdateCustomerToQueueRequest): Observable<any> {
      return this.http.put<UpdateCustomerToQueueRequest>(`${this.apiUrl}/customer`, command).pipe(
        catchError(error => {
          console.error('Erro ao editar pedido de cliente na fila:', error);
          return throwError(() => error);
        })
      );
    }
  
    startCustomerService(customerId: number, employeeAttendantId: number): Observable<any> {
      return this.http.get(`${this.apiUrl}/queue/start-service/${customerId}/${employeeAttendantId}`);
    }
  
    notifyTimeCustomerWasCalledInTheQueue(customerId: number): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/queue/notify-customer/${customerId}`);
    }
  
    notifyTimeCustomerServiceWasCompleted(customerId: number): Observable<any> {
      return this.http.get(`${this.apiUrl}/queue/finish-service/${customerId}`);
    }
  
    removeMissingCustomer(customerId: number, removeReason: string): Observable<any> {
      const command = {
        customerId: customerId,
        removeReason: removeReason
      };
  
      return this.http.put(`${this.apiUrl}/queue/remove`, command);
    }
  
    getOpenedQueueListByEmployeeId(employeeId: number, storeId: number | null, sharedQueue: boolean): Observable<QueueListResponse> {
      return this.http.get<QueueListResponse>(`${this.apiUrl}/queue/${employeeId}/${storeId}/${sharedQueue}/employee`);
    }
  
    isThereQueueOpenedTodayAsync(storeId: number): Observable<QueueListResponse> {
      return this.http.get<QueueListResponse>(`${this.apiUrl}/queue/${storeId}/queueOpenedToday`);
    }
  
    getAllCustomersInQueueByEmployeeAndStoreId(storeId: number, employeeId: number): Observable<CustomerInQueueForEmployeeResponse> {
      return this.http.get<CustomerInQueueForEmployeeResponse>(`${this.apiUrl}/queue/${storeId}/${employeeId}/customers-in-queue`);
    }
  
    loadAllQueuesOfStoreForOwner(storeId: number): Observable<any> {    
      return this.http.get(`${this.apiUrl}/queue/store/owners-queue/${storeId}`);
    }
  
    loadAllTodayQueue(storeId: number, filter: QueueFilterRequest): Observable<QueueListResponse> {
      return this.http.post<QueueListResponse>(
        `${this.apiUrl}/queue/${storeId}/filter`,
        filter
      );
    }
  
    hasOpenQueueForEmployeeToday(employeeId: number, storeId: number | null): Observable<boolean> {
      return this.getOpenedQueueListByEmployeeId(employeeId, storeId, false).pipe(
        map((response: QueueListResponse) => {
          return response.valid &&
            response.data?.length > 0 &&
            response.data[0].status === StatusQueueEnum.open;
        }),
        catchError(() => of(false))
      );
    }
  
}