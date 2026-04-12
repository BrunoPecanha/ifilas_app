import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { PaymentsResponse } from "src/models/responses/payment-response";

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  loadPayments(id: number): Observable<PaymentsResponse> {    
    return this.http.get<PaymentsResponse>(`${this.apiUrl}/payment/${id}`);
  }   
}