import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { FormArray, FormGroup } from "@angular/forms";
import { Observable } from "rxjs";
import { catchError } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { OpeningHoursRequest } from "src/models/requests/opening-hours-request";
import { StoreDetailResponse } from "src/models/responses/store-detail-response";
import { StoreProfessionalsResponse } from "src/models/responses/store-professionals-response";
import { StoreListResponse } from "src/models/responses/store-list-response";
import { ProfessionalResponse } from "src/models/responses/professional-response";
import { BaseResponse } from "src/models/responses/base-response";

@Injectable({
  providedIn: 'root'
})
export class StoresService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getStoresByOwner(id: number): Observable<StoreListResponse> {
    return this.http.get<StoreListResponse>(`${this.apiUrl}/store/owner/${id}`);
  }

  getStoreById(id: number): Observable<StoreDetailResponse> {
    return this.http.get<StoreDetailResponse>(`${this.apiUrl}/store/${id}`);
  }

  loadEmployeeStores(id: number, profileId: number): Observable<StoreListResponse> {
    const params = new HttpParams()
      .set('id', id.toString())
      .set('profile', profileId.toString());

    return this.http.get<StoreListResponse>(`${this.apiUrl}/store/employee`, { params });
  }

  loadStoreAndProfessionals(id: number): Observable<StoreProfessionalsResponse> {
    return this.http.get<StoreProfessionalsResponse>(`${this.apiUrl}/store/${id}/queue/professionals`);
  }

  isCostumerInQueue(queueId: number, customerId: number): Observable<BaseResponse> {
    return this.http.get<BaseResponse>(`${this.apiUrl}/customer/${queueId}/${customerId}`);
  }

  loadAllStoresUserIsInByUserId(id: number): Observable<StoreListResponse> {
    return this.http.get<StoreListResponse>(`${this.apiUrl}/store/${id}/customer/stores`);
  }


  loadProfessionals(storeId: number): Observable<ProfessionalResponse> {
    return this.http.get<ProfessionalResponse>(`${this.apiUrl}/store/${storeId}/professionals`);
  }

  updateStore(id: number, data: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/store/${id}`, data);
  }

  deleteStore(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/store/${id}`);
  }

  createStore(storeData: any): Observable<StoreListResponse> {
    return this.http.post<StoreListResponse>(`${this.apiUrl}/store`, storeData).pipe(
      catchError(error => {
        console.error('Erro ao criar loja:', error);
        throw error;
      })
    );
  }

  prepareStoreData(cadastroForm: FormGroup, ownerId: number): FormData {
    const formValue = cadastroForm.value;
    const formData = new FormData();

    formData.append('OwnerId', String(ownerId));
    formData.append('Name', formValue.name || '');
    formData.append('Cnpj', formValue.cnpj || '');
    formData.append('Cep', formValue.cep || '');
    formData.append('Address', formValue.address || '');
    formData.append('Number', formValue.number || '');
    formData.append('City', formValue.city || '');
    formData.append('State', formValue.state || '');
    formData.append('OpenAutomatic', String(formValue.openAutomatic || false));
    formData.append('UseAgenda', String(formValue.useAgenda || false));
    formData.append('inCaseFailureAcceptFinishWithoutQRCode', String(formValue.inCaseFailureAcceptFinishWithoutQRCode || false));
    formData.append('AttendSimultaneously', String(formValue.attendSimultaneously || false));
    formData.append('PhoneNumber', formValue.phoneNumber || '');
    formData.append('StoreSubtitle', formValue.storeSubtitle || '');
    formData.append('AcceptOtherQueues', String(formValue.acceptOtherQueues || false));
    formData.append('AnswerOutOfOrder', String(formValue.answerOutOfOrder || false));
    formData.append('AnswerScheduledTime', String(formValue.answerScheduledTime || false));
    formData.append('TimeRemoval', String(formValue.timeRemoval || ''));
    formData.append('WhatsAppNotice', String(formValue.whatsAppNotice || false));
    formData.append('CategoryId', String(formValue.categoryId || ''));
    formData.append('Instagram', formValue.instagram || '');
    formData.append('Facebook', formValue.facebook || '');
    formData.append('Youtube', formValue.youtube || '');
    formData.append('WebSite', formValue.website || '');
    formData.append('ReleaseOrdersBeforeGetsQueued', String(formValue.releaseOrdersBeforeGetsQueued || false));
    formData.append('EndServiceWithQRCode', String(formValue.endServiceWithQRCode || false));
    formData.append('StartServiceWithQRCode', String(formValue.startServiceWithQRCode || false));
    formData.append('ShareQueue', String(formValue.shareQueue || false));
    formData.append('HideAmountsWhenTransferringCustomers', String(formValue.hideAmountsWhenTransferringCustomers || false));
    formData.append('AllowTransfer', String(formValue.allowTransfer || false));
    formData.append('ApproveAppointmentsThatExceedTheTime', String(formValue.approveAppointmentsThatExceedTheTime || false));


    const logoControl = cadastroForm.get('logo');
    if (logoControl?.value instanceof File) {
      formData.append('Logo', logoControl.value, logoControl.value.name);
    }

    const wallPaperControl = cadastroForm.get('wallPaper');
    if (wallPaperControl?.value instanceof File) {
      formData.append('WallPaper', wallPaperControl.value, wallPaperControl.value.name);
    }

    formData.append('OpeningHours', JSON.stringify(this.getOpeningHoursRequest(cadastroForm)));
    formData.append('HighLights', JSON.stringify(this.getHighLightsRequest(cadastroForm)));

    return formData;
  }

  private getOpeningHoursRequest(cadastroForm: FormGroup): OpeningHoursRequest[] {
    const openingHoursArray = cadastroForm.get('openingHours') as FormArray;

    return openingHoursArray.controls
      .filter(control => control.get('activated')?.value)
      .map(control => ({
        weekDay: control.get('weekday')?.value,
        start: control.get('start')?.value,
        end: control.get('end')?.value,
        activated: true
      }));
  }

  private getHighLightsRequest(cadastroForm: FormGroup): any {
    const highLightsArray = cadastroForm.get('highLights') as FormArray;

    return highLightsArray.controls.map(control => ({
      phrase: control.get('phrase')?.value,
      icon: control.get('icon')?.value,
      activated: control.get('activated')?.value || false
    }));
  }
}