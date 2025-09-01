import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { EmployeeStoreSendInviteRequest } from 'src/models/requests/employee-store-send-invite-request';
import { EmployeeStoreRespondInviteRequest } from 'src/models/requests/employee-store-respond-invite-request';
import { EmployeeStoreItemModel } from 'src/models/employee-store-item-model';
import { EmployeeStoreService } from 'src/services/employee.store.service';
import { SessionService } from 'src/services/session.service';
import { UserModel } from 'src/models/user-model';
import { StoreModel } from 'src/models/store-model';

@Component({
  selector: 'app-associated-professional',
  templateUrl: './associated-professional.page.html',
  styleUrls: ['./associated-professional.page.scss']
})
export class AssociatedProfessionalPage implements OnInit {
  userRole: number | null = null;
  user: UserModel = {} as UserModel;
  store: StoreModel = {} as StoreModel;

  professionals: EmployeeStoreItemModel[] = [];
  sentInvites: EmployeeStoreItemModel[] = [];
  pendingInvites: EmployeeStoreItemModel[] = [];
  associatedEstablishments: EmployeeStoreItemModel[] = [];

  constructor(
    private alertController: AlertController,
    private loadingController: LoadingController,
    private employeeStoreService: EmployeeStoreService,
    private sessionService: SessionService
  ) { }

  async ngOnInit() {
    this.userRole = await this.sessionService.getProfile();
    this.user = await this.sessionService.getUser();

    if (this.userRole === 2) {
      this.store = await this.sessionService.getStore();
    }

    this.loadData();
  }

  loadData() {
    if (this.userRole === 2) {
      this.loadStoreInvites();
    } else {
      this.loadEmployeeInvites();
    }
  }

  loadStoreInvites() {
    this.employeeStoreService.loadPendingAndAcceptedInvitesByStore(this.store.id).subscribe({
      next: (response) => {
        if (response.valid) {
          this.processStoreInvites(response.data.employeeStoreAssociations);
        } else {
          this.presentAlert(response.message, 'Erro ao carregar convites');
        }
      },
      error: (error) => {
        this.presentAlert('Erro ao carregar convites do estabelecimento', 'Erro');
      }
    });
  }

  loadEmployeeInvites() {
    this.employeeStoreService.loadPendingAndAcceptedInvitesByUser(this.user.id).subscribe({
      next: (response) => {
        if (response.valid) {
          this.processEmployeeInvites(response.data.employeeStoreAssociations);
        } else {
          this.presentAlert(response.message, 'Erro ao carregar convites');
        }
      },
      error: (error) => {
        this.presentAlert('Erro ao carregar seus convites', 'Erro');
      }
    });
  }

  processStoreInvites(invites: EmployeeStoreItemModel[]) {
    this.professionals = invites.filter(i => !i.inviteIsPending);
    this.sentInvites = invites.filter(i => i.inviteIsPending);
  }

  processEmployeeInvites(invites: EmployeeStoreItemModel[]) {
    this.associatedEstablishments = invites.filter(i => !i.inviteIsPending);
    this.pendingInvites = invites.filter(i => i.inviteIsPending);
  }

  async presentAlert(message: string, header: string = 'Aviso') {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async presentLoading(message: string = 'Processando...'): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({ message });
    await loading.present();
    return loading;
  }

  async confirmProfessionalRemoval(employeeId: number) {
    const professional = this.professionals.find(p => p.employeeId === employeeId);
    if (!professional) return;

    const alert = await this.alertController.create({
      header: 'Remover Funcionário',
      message: `Tem certeza que deseja remover ${professional.employeeName}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Remover',
          role: 'destructive',
          handler: () => {
            this.removerProfissional(employeeId, professional.storeId);
          }
        }
      ]
    });
    await alert.present();
  }

  async removerProfissional(employeeId: number, storeId: number): Promise<void> {
    const loading = await this.presentLoading('Removendo colaborador...');

    const request: EmployeeStoreRespondInviteRequest = {
      userId: employeeId,
      storeId: storeId,
      answer: false
    };

    this.employeeStoreService.respondInvite(request).subscribe({
      next: (response) => {
        loading.dismiss();
        if (response.valid) {
          this.presentAlert(`Colaborador removido do estabelecimento.`, 'Removido com Sucesso');
          this.loadStoreInvites();
        } else {
          this.presentAlert(response.message, 'Erro ao remover colaborador');
        }
      },
      error: (error) => {
        loading.dismiss();
        this.presentAlert('Erro ao remover colaborador', 'Erro');
      }
    });
  }

  async confirmCancellationInvitation(employeeId: number) {
    const invite = this.sentInvites.find(i => i.employeeId === employeeId);
    if (!invite) return;

    const alert = await this.alertController.create({
      header: 'Cancelar Convite',
      message: `Deseja cancelar o convite para ${invite.employeeName}?`,
      buttons: [
        {
          text: 'Não',
          role: 'cancel'
        },
        {
          text: 'Sim, cancelar',
          role: 'destructive',
          handler: () => {
            this.cancelarConvite(employeeId, invite.storeId);
          }
        }
      ]
    });
    await alert.present();
  }

  async cancelarConvite(employeeId: number, storeId: number): Promise<void> {
    const loading = await this.presentLoading('Cancelando convite...');

    const request: EmployeeStoreRespondInviteRequest = {
      userId: employeeId,
      storeId: storeId,
      answer: false
    };

    this.employeeStoreService.respondInvite(request).subscribe({
      next: (response) => {
        loading.dismiss();
        if (response.valid) {
          this.presentAlert('Convite cancelado com sucesso.', 'Convite Cancelado');
          this.loadStoreInvites();
        } else {
          this.presentAlert(response.message, 'Erro ao cancelar convite');
        }
      },
      error: (error) => {
        loading.dismiss();
        this.presentAlert('Erro ao cancelar convite', 'Erro');
      }
    });
  }

  async sendInvite(cpf: string) {
    const cpfNumerico = cpf.replace(/\D/g, '');

    if (!cpfNumerico) {
      this.presentAlert('Por favor, informe o CPF do profissional.', 'CPF Inválido');
      return;
    }

    if (!this.isCpfValid(cpfNumerico)) {
      this.presentAlert('Por favor, informe um CPF válido com 11 dígitos.', 'CPF Inválido');
      return;
    }

    const loading = await this.presentLoading('Enviando convite...');

    const request: EmployeeStoreSendInviteRequest = {
      storeId: this.store.id,
      cpf: cpfNumerico
    };

    this.employeeStoreService.sendInviteToEmployee(request).subscribe({
      next: (response) => {
        loading.dismiss();
        if (response.valid) {
          this.presentAlert(`Convite enviado para CPF ${this.formatCPF(cpfNumerico)}`, 'Convite Enviado');
          this.loadStoreInvites();
        } else {
          this.presentAlert(response.message, 'Erro ao enviar convite');
        }
      },
      error: (error) => {
        loading.dismiss();
        this.presentAlert('Erro ao enviar convite', 'Erro');
      }
    });
  }

  async processInvite(storeId: number): Promise<void> {
    const loading = await this.presentLoading('Processando aceite...');

    const request: EmployeeStoreRespondInviteRequest = {
      userId: this.user.id,
      storeId: storeId,
      answer: true
    };

    this.employeeStoreService.respondInvite(request).subscribe({
      next: (response) => {
        loading.dismiss();
        if (response.valid) {
          this.presentAlert(`Você agora está associado ao estabelecimento!`, 'Associação Confirmada');
          this.loadEmployeeInvites();
        } else {
          this.presentAlert(response.message, 'Erro ao aceitar convite');
        }
      },
      error: (error) => {
        loading.dismiss();
        this.presentAlert('Erro ao aceitar convite', 'Erro');
      }
    });
  }

  async denyInvite(storeId: number) {
    const invite = this.pendingInvites.find(i => i.storeId === storeId);
    if (!invite) return;

    const alert = await this.alertController.create({
      header: 'Recusar Convite',
      message: `Deseja recusar o convite de ${invite.storeName}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Recusar',
          role: 'destructive',
          handler: () => {
            this.processDenyInvite(storeId);
          }
        }
      ]
    });
    await alert.present();
  }

  async processDenyInvite(storeId: number): Promise<void> {
    const loading = await this.presentLoading('Processando recusa...');

    const request: EmployeeStoreRespondInviteRequest = {
      userId: this.user.id,
      storeId: storeId,
      answer: false
    };

    this.employeeStoreService.respondInvite(request).subscribe({
      next: (response) => {
        loading.dismiss();
        if (response.valid) {
          this.presentAlert(`Convite recusado`, 'Resposta a Convite');
          this.loadEmployeeInvites();
        } else {
          this.presentAlert(response.message, 'Erro ao recusar convite');
        }
      },
      error: (error) => {
        loading.dismiss();
        this.presentAlert('Erro ao recusar convite', 'Erro');
      }
    });
  }

  async confirmEstablishmentExit(storeId: number) {
    const establishment = this.associatedEstablishments.find(e => e.storeId === storeId);

    if (!establishment) 
      return;

    const alert = await this.alertController.create({
      header: 'Sair do Estabelecimento',
      message: `Deseja realmente sair de ${establishment.storeName}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sair',
          role: 'destructive',
          handler: () => {
            this.exitFromStore(storeId);
          }
        }
      ]
    });
    await alert.present();
  }

  async exitFromStore(storeId: number): Promise<void> {
    const loading = await this.presentLoading('Processando saída...');

    const request: EmployeeStoreRespondInviteRequest = {
      userId: this.user.id,
      storeId: storeId,
      answer: false
    };

    this.employeeStoreService.respondInvite(request).subscribe({
      next: (response) => {
        loading.dismiss();
        if (response.valid) {
          this.presentAlert(`Você não está mais associado ao estabelecimento`, 'Associação Encerrada');
          this.loadEmployeeInvites();
        } else {
          this.presentAlert(response.message, 'Erro ao sair do estabelecimento');
        }
      },
      error: (error) => {
        loading.dismiss();
        this.presentAlert('Erro ao sair do estabelecimento', 'Erro');
      }
    });
  }

  isCpfValid(cpf: string): boolean {
    return /^\d{11}$/.test(cpf) && !/(\d)\1{10}/.test(cpf);
  }

  formatCPF(cpf: string): string {
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  async openInviteModal() {
    const alert = await this.alertController.create({
      header: 'Enviar Convite',
      subHeader: 'Informe o CPF do profissional',
      inputs: [
        {
          name: 'cpf',
          type: 'text',
          placeholder: 'Só números',
          attributes: {
            maxlength: 14
          },
          handler: (input) => {
            input.value = this.formatCPF(input.value);
            return input;
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: (data) => {
            const cpfLimpo = data.cpf.replace(/\D/g, '');
            if (cpfLimpo.length === 11 && this.isCpfValid(cpfLimpo)) {
              this.sendInvite(cpfLimpo);
              return true;
            } else {
              this.presentAlert('Por favor, informe um CPF válido com 11 dígitos.', 'CPF Inválido');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }
}