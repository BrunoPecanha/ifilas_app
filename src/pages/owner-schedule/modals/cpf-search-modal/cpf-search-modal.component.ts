import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CustomerService } from 'src/services/customer.service';
import { SessionService } from 'src/services/session.service';
import { ToastService } from 'src/services/toast.service';

@Component({
  selector: 'app-cpf-search-modal',
  templateUrl: "./cpf-search-modal.component.html",
  styleUrls: ["./cpf-search-modal.component.scss"],
})
export class CpfSearchModalComponent {
  cpf: string = '';
  loading: boolean = false;
  customer: any | null = null;
  error: string = '';
  isSelecting: boolean = false;

  constructor(
    private modalController: ModalController,
    private customerService: CustomerService,
    private toastService: ToastService,
    private sessionStorage: SessionService
  ) { }

  async selectCustomer() {
    if (this.isSelecting || !this.customer)
      return;

    this.isSelecting = true;

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      this.modalController.dismiss({
        customer: this.customer
      });
      
      this.sessionStorage.setGenericKey(this.customer.id, "customerId", );

    } catch (error) {
      console.error('Erro ao selecionar cliente:', error);
      this.toastService.show('Erro ao selecionar cliente', 'danger');
      this.isSelecting = false;
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  clearSearch() {
    this.cpf = '';
    this.customer = null;
    this.error = '';
    this.isSelecting = false;
  }

  searchCustomer() {
    const cleanCpf = this.cpf.replace(/\D/g, '');

    if (cleanCpf.length <= 11) {
      this.cpf = this.formatCpf(cleanCpf);
    }

    if (cleanCpf.length === 11) {
      this.performSearch(cleanCpf);
    } else {
      this.customer = null;
      this.error = '';
    }
  }

  private formatCpf(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private async performSearch(cleanCpf: string) {
    this.loading = true;
    this.error = '';
    this.customer = null;

    try {
      const response = await this.customerService.getByCpfAsync(cleanCpf).toPromise();

      if (response && response.data) {
        this.customer = response.data
        this.error = '';
      } else {
        this.error = 'Cliente não encontrado. Verifique o CPF e tente novamente.';
      }

    } catch (err: any) {
      console.error('Erro na busca por CPF:', err);

      if (err.status === 404) {
        this.error = 'Cliente não encontrado. Verifique o CPF e tente novamente.';
      } else if (err.status === 400) {
        this.error = 'CPF inválido. Verifique o número digitado.';
      } else {
        this.error = 'Erro ao buscar cliente. Tente novamente.';
      }

    } finally {
      this.loading = false;
    }
  }
}