import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { CategoryResponse } from "src/models/responses/category-response";
import { PagedResponse } from "src/models/responses/paged-response";
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

  getAllLikedStoresByUserId(id: number): Observable<StoreListResponse> {
    return this.http.get<StoreListResponse>(`${this.apiUrl}/favorite/liked-stores/${id}`);
  }

  loadFilteredStores(
    userId: number,
    categoryId?: number | null,
    quickFilter?: string,
    page: number = 1,
    pageSize: number = 10
  ): Observable<PagedResponse> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }
    if (quickFilter) {
      params = params.set('quickFilter', quickFilter);
    }

    return this.http.get<PagedResponse>(`${this.apiUrl}/store/filter`, { params });
  }
}