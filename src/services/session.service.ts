import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private router: Router) { }

  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';
  private readonly STORES_KEY = 'store';
  private readonly PROFILE_KEY = 'profile';
  private readonly CUSTOMER_KEY = 'customer';
  private readonly REFRESH_TOKEN = 'refresh_token';

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): any | null {
    const userJson = sessionStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  getCustomer(): string | null {
    return sessionStorage.getItem(this.CUSTOMER_KEY);
  }

  getStore(): any | null {
    const storeJson = sessionStorage.getItem(this.STORES_KEY);
    return storeJson ? JSON.parse(storeJson) : null;
  }

  isLogged(): boolean {
    return !!this.getToken() && !!this.getUser();
  }

  getProfile(): any | null {
    const profile = sessionStorage.getItem(this.PROFILE_KEY);
    return profile ? JSON.parse(profile) : -1;
  }

  setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  setStore(store: any): void {
    sessionStorage.setItem(this.STORES_KEY, JSON.stringify(store));
  }

  setProfile(profile: number) {
    sessionStorage.setItem(this.PROFILE_KEY, profile.toString());
  }

  setCustomer(customer: number) {
    sessionStorage.setItem(this.CUSTOMER_KEY, customer.toString());
  }

  setUser(user: any): void {
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  setGenericKey(item: any, key: string): void {
    sessionStorage.setItem(key, JSON.stringify(item));
  }

  getGenericKey(key: string) {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  getString(key: string): string | null {
    return sessionStorage.getItem(key);
  }

  setString(key: string, value: string): void {
    sessionStorage.setItem(key, value);
  }

  getObject<T>(key: string): T | null {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) as T : null;
  }

  setObject(key: string, value: any): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }


  removeGenericKey(key: string) {
    sessionStorage.removeItem(key);
  }

  clearSessionData(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.STORES_KEY);
    sessionStorage.removeItem(this.PROFILE_KEY);
    sessionStorage.removeItem(this.CUSTOMER_KEY);
  }

  clearRefreshToken(): void {
    localStorage.removeItem(this.REFRESH_TOKEN);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  setRefreshToken(token: string) {
    localStorage.setItem(this.REFRESH_TOKEN, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN);
  }

  logout(): void {
    this.clearSessionData();
    this.clearRefreshToken();
    this.router.navigate(['/splash']);
  }
}