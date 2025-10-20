import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  generate(customerId: number, queueOrScheduleId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/qrcode/generate/${customerId}/${queueOrScheduleId}`, {
      responseType: 'text',
    });
  }

  validate(validadeQrCodeDto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/qrcode/validate`, validadeQrCodeDto);
  }
}