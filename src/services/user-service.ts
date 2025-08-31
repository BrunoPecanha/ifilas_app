import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserModel } from 'src/models/user-model';
import { environment } from 'src/environments/environment';
import { UserRequest } from 'src/models/requests/user-request';
import { Observable, Subject } from 'rxjs';
import { UserResponse } from 'src/models/responses/user-response';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl;

  private profileUpdated = new Subject<void>();
  profileUpdated$ = this.profileUpdated.asObservable();

  constructor(private http: HttpClient) {}

  createUser(user: UserRequest): Observable<UserModel> {
    return this.http.post<UserModel>(`${this.apiUrl}/user`, user);
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/user/${id}`);
  }

  notifyProfileUpdate() {
    this.profileUpdated.next();
  }

  getUserInfoById(id: number, profile: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/info/${id}/${profile}`);
  }

  updateUser(data: any): Observable<UserResponse> {
    let options = {};

    if (!(data instanceof FormData)) {
      options = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      };
    }

    return this.http.put<UserResponse>(`${this.apiUrl}/user`, data, options);
  }

  setNewPassword(email: string, password: string): Observable<any> {
    const body = {
      email: email,
      passWord: password
    };

    return this.http.patch<any>(`${this.apiUrl}/user/new-password`, body, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }
}
