import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { EmployeeStoreRespondInviteRequest } from "src/models/requests/employee-store-respond-invite-request";
import { EmployeeStoreSendInviteRequest } from "src/models/requests/employee-store-send-invite-request";
import { BaseResponse } from "src/models/responses/base-response";
import { EmployeeStoreResponse } from "src/models/responses/employee-store-response";

@Injectable({
  providedIn: 'root'
})
export class EmployeeStoreService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  sendInviteToEmployee(serviceData: EmployeeStoreSendInviteRequest): Observable<BaseResponse> {
    return this.http.post<BaseResponse>(`${this.apiUrl}/employee/send`, serviceData);
  }

  respondInvite(serviceData: EmployeeStoreRespondInviteRequest): Observable<BaseResponse> {
    return this.http.post<BaseResponse>(`${this.apiUrl}/employee/respond`, serviceData);
  }

  loadPendingAndAcceptedInvitesByUser(id: number): Observable<EmployeeStoreResponse> {
    return this.http.get<EmployeeStoreResponse>(`${this.apiUrl}/employee/employee-invites/${id}`);
  }

  loadPendingAndAcceptedInvitesByStore(id: number): Observable<EmployeeStoreResponse> {
    return this.http.get<EmployeeStoreResponse>(`${this.apiUrl}/employee/store-invites/${id}`);
  }

  useAgenda(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/employee/useAgenda/${userId}`);
  }
}