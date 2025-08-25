import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, Observable, of } from "rxjs";
import { environment } from "src/environments/environment";
import { AddressModel } from "src/models/address-model";
import { addressResponse } from "src/models/responses/address-response";

@Injectable({
  providedIn: 'root'
})
export class GeoLocateService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAddressByCep(cep: string): Observable<addressResponse> {
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return of({
        valid: false,
        data: {} as AddressModel,
        message: "CEP inválido. Deve conter 8 dígitos."
      });
    }

    return this.http.get<AddressModel>(`${this.apiUrl}/address/${cleanCep}`).pipe(
      map((addressData: AddressModel) => {
        return {
          valid: true,
          data: addressData,
          message: "Endereço encontrado com sucesso."
        };
      }),
      catchError(error => {
        console.error('Erro na busca do endereço:', error);

        let errorMessage = "Erro ao buscar endereço. Tente novamente.";

        if (error.status === 404) {
          errorMessage = "CEP não encontrado.";
        } else if (error.status === 400) {
          errorMessage = "CEP inválido.";
        } else if (error.status === 0) {
          errorMessage = "Erro de conexão. Verifique sua internet.";
        }

        return of({
          valid: false,
          data: {} as AddressModel,
          message: errorMessage
        });
      })
    );
  }
}