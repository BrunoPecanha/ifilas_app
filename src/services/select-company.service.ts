import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { CategoryResponse } from "src/models/responses/category-response";
import { StoreListResponse } from "src/models/responses/store-list-response";



@Injectable({
  providedIn: 'root'
})
export class SelectCompanyService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  loadCategories(): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(`${this.apiUrl}/category/all`);
  }

  loadStoresByCategoryId(id: number): Observable<StoreListResponse> {
    return this.http.get<StoreListResponse>(`${this.apiUrl}/store/${id}/stores`);
  }

  loadStores(): Observable<StoreListResponse> {
    return this.http.get<StoreListResponse>(`${this.apiUrl}/store/all`);
  }

  loadStoreById(id: number): Observable<StoreListResponse> {
    return this.http.get<StoreListResponse>(`${this.apiUrl}/store/all`);
  }

  loadNearbyStoresById(userId: number, page?: number, pageSize?: number): Observable<StoreListResponse> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('page', page || 1)
      .set('pageSize', pageSize || 10);   

    return this.http.get<StoreListResponse>(`${this.apiUrl}/store/nearby`, { params });
  }

  loadFilteredStores(userId: number, categoryId?: number | null, quickFilter?: string): Observable<StoreListResponse> {
    const params = new HttpParams()
      .set('categoryId', categoryId ? categoryId.toString() : '')
      .set('quickFilter', quickFilter || '')
      .set('userId', userId.toString());

    return this.http.get<StoreListResponse>(`${this.apiUrl}/store/filter`, { params });
  }
}
