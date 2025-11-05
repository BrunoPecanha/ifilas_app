import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { CustomerResponse } from "src/models/responses/customer-response";
import { PendingResponse } from "src/models/responses/pending-response";

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  loadCustomerInfo(id: number): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.apiUrl}/customer/${id}`);
  }

  getByCpfAsync(cpf: string): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.apiUrl}/customer/add-schedule/${cpf}`);
  }

  getPendingOrdersCount(storeId: number): Observable<PendingResponse> {
    return this.http.get<PendingResponse>(`${this.apiUrl}/customer/pending/${storeId}`);
  }

  updatePriceAndTimeForVariableServiceAsync(customerServicesUpdate: any): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/customer`,
      customerServicesUpdate
    );
  }
}