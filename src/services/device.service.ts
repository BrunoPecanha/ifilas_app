import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { PlatformEnum } from 'src/models/enums/platform.enum';

@Injectable({ providedIn: 'root' })
export class DeviceService {

  constructor(private http: HttpClient) {
  }

  register(token: string, platform: PlatformEnum): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/device/register`,
      { token, platform }
    );
  }

  unregister(token: string, userId: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/device/unregister/${token}/${userId}`
    );
  }
}