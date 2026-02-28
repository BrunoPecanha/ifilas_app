import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, Observable, of, tap, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { AuthResponse } from "src/models/responses/auth-responsel";
import { PushNotificationService } from "./push-notification.service";


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private pushService: PushNotificationService) { }

  login(credentials: { email: string, password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  validateUser(command: { email: string, codeToValidate: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/validate/newUser`, command).pipe(
      tap(response => {
        return response;
      })
    );
  }

  generateNewCodeForValidate(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/auth/${email}`);
  }

  logout(): void {
    this.clearSession();
  }

  refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearSession();
      return Promise.reject(new Error('Refresh token não encontrado'));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh-token`, { refreshToken }).pipe(
      tap(response => {
        this.setSession(response);
      })
    ).toPromise().then(response => response as AuthResponse);
  }

  getToken(): string | null {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setSession(authResponse: AuthResponse) {
    sessionStorage.setItem('token', authResponse.data.token);
    localStorage.setItem('refresh_token', authResponse.data.refreshToken);
  }

  private async clearSession() {
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('token');
    // await this.pushService.clearTokenOnLogout();
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }
}