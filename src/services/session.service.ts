import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private router: Router) {}

  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';
  private readonly STORES_KEY = 'store';
  private readonly PROFILE_KEY = 'profile';
  private readonly CUSTOMER_KEY = 'customer';
  private readonly REFRESH_TOKEN = 'refresh_token';


  private userSubject = new BehaviorSubject<any | null>(this.getUserFromStorage());
  user$ = this.userSubject.asObservable();

  private profileSubject = new BehaviorSubject<number>(this.getProfileFromStorage());
  profile$ = this.profileSubject.asObservable();

  private storeSubject = new BehaviorSubject<any | null>(this.getStoreFromStorage());
  store$ = this.storeSubject.asObservable();


  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): any | null {
    return this.getUserFromStorage();
  }

  getCustomer(): string | null {
    return sessionStorage.getItem(this.CUSTOMER_KEY);
  }

  getStore(): any | null {
    return this.getStoreFromStorage();
  }

  isLogged(): boolean {
    return !!this.getToken() && !!this.getUser();
  }

  getProfile(): number {
    return this.getProfileFromStorage();
  }


  setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  setUser(user: any): void {
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.userSubject.next(user); 
  }

  setProfile(profile: number): void {
    sessionStorage.setItem(this.PROFILE_KEY, profile.toString());
    this.profileSubject.next(profile); // 🔥
  }

  setStore(store: any): void {
    sessionStorage.setItem(this.STORES_KEY, JSON.stringify(store));
    this.storeSubject.next(store); // 🔥
  }

  setCustomer(customer: number) {
    sessionStorage.setItem(this.CUSTOMER_KEY, customer.toString());
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

    this.userSubject.next(null);
    this.profileSubject.next(-1);
    this.storeSubject.next(null);
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
    this.router.navigate(['/splash'], { replaceUrl: true });
  }


  private getUserFromStorage(): any | null {
    const userJson = sessionStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private getProfileFromStorage(): number {
    const profile = sessionStorage.getItem(this.PROFILE_KEY);
    return profile ? Number(profile) : -1;
  }

  private getStoreFromStorage(): any | null {
    const storeJson = sessionStorage.getItem(this.STORES_KEY);
    return storeJson ? JSON.parse(storeJson) : null;
  }
}