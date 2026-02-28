import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, delay, from, map, Observable, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import QRCode from 'qrcode';
import { QueueListResponse } from 'src/models/responses/queue-list-response';
import { StatusQueueEnum } from 'src/models/enums/status-queue.enum';
import { CustomerInQueueForEmployeeResponse } from 'src/models/responses/customer-in-queue-for-employee-response';
import { CustomerInQueueCardResponse } from 'src/models/responses/customer-in-queue-card-response';
import { CustomerInQueueCardDetailResponse } from 'src/models/responses/customer-in-queue-card-detail-response';
import { AddCustomerToQueueRequest } from 'src/models/requests/add-customer-to-queue-request';
import { UpdateCustomerToQueueRequest } from 'src/models/requests/update-customer-to-queue-request';
import { QueueFilterRequest } from 'src/models/requests/queue-filter-request';
import { QueueResponse } from 'src/models/responses/queue-response';
import { QueueCreateRequest } from 'src/models/requests/queue-create-request';
import { QueuePauseRequest } from 'src/models/requests/queue-pause-request';
import { QueueReportResponse } from 'src/models/responses/queue-report-response';
import { QueueCloseRequest } from 'src/models/requests/queue-close-request';


@Injectable({
  providedIn: 'root'
})
export class QueueService {
  private apiUrl = environment.apiUrl;

  qrCodeImage: string = '';

  constructor(private http: HttpClient) { }

  addCustomerToQueue(command: AddCustomerToQueueRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/queue/addCustomer`, command).pipe(
      catchError(error => {
        console.error('Erro ao adicionar cliente à fila:', error);
        return throwError(() => error);
      })
    );
  }

  updateCustomerName(customerId: number, newName: string) {
    return this.http.patch(`${this.apiUrl}/queue/${customerId}/name`, { name: newName });
  }

  createQueue(command: QueueCreateRequest): Observable<QueueResponse> {
    return this.http.post<QueueResponse>(`${this.apiUrl}/queue`, command).pipe(
      catchError(error => {
        console.error('Erro ao criar a fila:', error);
        return throwError(() => error);
      })
    );
  }

  closeQueue(command: QueueCloseRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/queue/close`, command).pipe(
      catchError(error => {
        console.error('Erro ao encerrar a fila:', error);
        return throwError(() => error);
      })
    );
  }

  existCustuomerInQueueWaiting(queueId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/queue/${queueId}/waiting`);
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

  getPosicao(): Observable<{
    pessoasNaFila: { avatar: string }[];
    posicao: number;
    ehMinhaVez: boolean;
  }> {
    const pessoasNaFila = [
      { avatar: 'person-circle' },
      { avatar: 'person-circle' },
      { avatar: 'person-circle' },
      { avatar: 'person-circle' },
      { avatar: 'person-circle' },
    ];

    const posicaoUsuario: number = 3;
    const ehMinhaVez = posicaoUsuario === 1;

    return of({
      pessoasNaFila,
      posicao: posicaoUsuario,
      ehMinhaVez
    }).pipe(delay(1000));
  }

  gerarQrCode(token: string): Observable<{ qrCode: string }> {

    return from(
      QRCode.toDataURL(token, { errorCorrectionLevel: 'H' })
        .then((url: string) => {
          this.qrCodeImage = url;
          return { qrCode: url };
        })
        .catch((err) => {
          console.error('Erro ao gerar o QR Code:', err);
          return { qrCode: '' };
        })
    );
  }

  getCustomerInQueueCard(userId: number): Observable<CustomerInQueueCardResponse> {
    return this.http.get<CustomerInQueueCardResponse>(`${this.apiUrl}/queue/${userId}/card`);
  }

  getQueueReport(idQueue: number): Observable<QueueReportResponse> {
    return this.http.get<QueueReportResponse>(`${this.apiUrl}/queue/${idQueue}/report`);
  }

  getCustomerInQueueCardDetails(customerId: number, queueId: number): Observable<CustomerInQueueCardDetailResponse> {
    return this.http.get<CustomerInQueueCardDetailResponse>(`${this.apiUrl}/queue/${customerId}/${queueId}/card/details`);
  }

  exitQueue(custeomerId: number, queueId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/queue/${custeomerId}/${queueId}/exit`);
  }

  transferCustomer(payload: {
    customerId: number;
    currentSchedule?: number | null;
    currentQueue?: number | null;
    destinationScheduleId?: number | null;
    destinationQueueId?: number | null;
    date: string;
    removeCustomerFromQueueReason: string;
  }) {
    return this.http.put(`${this.apiUrl}/queue/transfer-customer`,  payload);   
  }
}