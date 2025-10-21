import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { FavoriteResponse } from "src/models/responses/favorite-response";

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  toggleStoreLike(storeId: number, id: any) {
    throw new Error('Method not implemented.');
  }
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  likedStore(storeId: number, userId: number): Observable<any> {
    return this.http.get<FavoriteResponse>(
      `${this.apiUrl}/favorite/liked/store/${storeId}/${userId}`,
      {}
    );
  }

  likeStore(storeId: number, userId: number): Observable<FavoriteResponse> {
    return this.http.post<FavoriteResponse>(
      `${this.apiUrl}/favorite/like/store/${storeId}/${userId}`,
      {}
    );
  }

  dislikeStore(storeId: number, userId: number): Observable<FavoriteResponse> {
    return this.http.delete<FavoriteResponse>(
      `${this.apiUrl}/favorite/dislike/store/${storeId}/${userId}`
    );
  }

  likeProfessional(professionalId: number, userId: number): Observable<FavoriteResponse> {
    return this.http.post<FavoriteResponse>(
      `${this.apiUrl}/favorite/like/professional/${professionalId}/${userId}`,
      {}
    );
  }

  dislikeProfessional(professionalId: number, userId: number): Observable<FavoriteResponse> {
    return this.http.delete<FavoriteResponse>(
      `${this.apiUrl}/favorite/dislike/professional/${professionalId}/${userId}`
    );
  }
}