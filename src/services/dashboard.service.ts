import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { DashBoardResponse } from "src/models/responses/dashboard-response";

@Injectable({
  providedIn: 'root'
})
export class DashBoardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  loadCustomerInfo(id: number): Observable<DashBoardResponse> {
    return this.http.get<DashBoardResponse>(`${this.apiUrl}/dashboard/${id}`);
  } 

   loadCustomerPredictTime(id: number): Observable<any> {
    return this.http.get<DashBoardResponse>(`${this.apiUrl}/dashboard/predict/${id}`);
  } 
}