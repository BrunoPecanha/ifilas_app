import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, tap, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { AuthResponse } from "src/models/responses/auth-responsel";


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  login(credentials: { email: string, password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  logout(): void {
    this.clearSession();
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();    
    
    if (!refreshToken) {
      this.clearSession();
      return throwError(() => new Error('Refresh token não encontrado'));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh-token`, { refreshToken }).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
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
    localStorage.setItem('refresh_token', authResponse.data.refreshToken);
  }

  private clearSession() {
    localStorage.removeItem('refresh_token');
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }
}