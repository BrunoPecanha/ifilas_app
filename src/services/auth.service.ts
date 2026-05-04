import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { environment } from "src/environments/environment";
import { AuthResponse } from "src/models/responses/auth-responsel";
import { PushNotificationService } from "./push-notification.service";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;
  private token: string | null = null;

  constructor(
    private http: HttpClient,
    private pushService: PushNotificationService
  ) {
    // 🔥 Carrega token ao iniciar o serviço
    this.token = sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  // ================= LOGIN =================

  login(credentials: { email: string, password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => this.setSession(response))
    );
  }

  validateUser(command: { email: string, codeToValidate: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/validate/newUser`, command);
  }

  generateNewCodeForValidate(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/auth/${email}`);
  }

  // ================= TOKEN =================

  getToken(): string | null {
    return this.token;
  }

  async getTokenAsync(): Promise<string | null> {
    // 🔥 Agora é seguro e síncrono na prática
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
    sessionStorage.setItem('token', token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // ================= REFRESH =================

  refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearSession();
      return Promise.reject(new Error('Refresh token não encontrado'));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh-token`, { refreshToken })
      .pipe(
        tap(response => this.setSession(response))
      )
      .toPromise()
      .then(response => response as AuthResponse);
  }

  // ================= SESSION =================

  private setSession(authResponse: AuthResponse) {
    const token = authResponse.data.token;

    this.token = token;

    sessionStorage.setItem('token', token);
    localStorage.setItem('refresh_token', authResponse.data.refreshToken);
  }

  logout(): void {
    this.clearSession();
  }

  private clearSession() {
    this.token = null;

    sessionStorage.removeItem('token');
    localStorage.removeItem('refresh_token');

    // await this.pushService.clearTokenOnLogout();
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }
}