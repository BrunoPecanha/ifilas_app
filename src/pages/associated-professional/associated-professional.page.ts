import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { EmployeeStoreSendInviteRequest } from 'src/models/requests/employee-store-send-invite-request';
import { EmployeeStoreRespondInviteRequest } from 'src/models/requests/employee-store-respond-invite-request';
import { EmployeeStoreItemModel } from 'src/models/employee-store-item-model';
import { EmployeeStoreService } from 'src/services/employee.store.service';
import { SessionService } from 'src/services/session.service';
import { UserModel } from 'src/models/user-model';
import { StoreModel } from 'src/models/store-model';
import { ToastService } from 'src/services/toast.service';

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
    private sessionService: SessionService,
    private toastService: ToastService
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
          this.toastService.show(response.message, 'danger');
        }
      },
      error: (error) => {
        this.toastService.show('Erro ao carregar convites do estabelecimento', 'danger');
      }
    });
  }

  loadEmployeeInvites() {
    this.employeeStoreService.loadPendingAndAcceptedInvitesByUser(this.user.id).subscribe({
      next: (response) => {
        if (response.valid) {
          this.processEmployeeInvites(response.data.employeeStoreAssociations);
        } else {
          this.toastService.show(response.message, 'danger');
        }
      },
      error: (error) => {
        this.toastService.show('Erro ao carregar seus convites', 'danger');
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
          this.toastService.show(`Colaborador removido do estabelecimento.`, 'success');
          this.loadStoreInvites();
        } else {
          this.toastService.show(response.message, 'danger');
        }
      },
      error: (error) => {
        loading.dismiss();
        this.toastService.show('Erro ao remover colaborador', 'danger');
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
            this.cancelInvite(employeeId, invite.storeId);
          }
        }
      ]
    });
    await alert.present();
  }

  async cancelInvite(employeeId: number, storeId: number): Promise<void> {
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
          this.toastService.show('Convite cancelado com sucesso.', 'success');
          this.loadStoreInvites();
        } else {
          this.toastService.show(response.message, 'danger');
        }
      },
      error: (error) => {
        loading.dismiss();
        this.toastService.show('Erro ao cancelar convite', 'danger');
      }
    });
  }

  async sendInvite(userCode: number) {
    if (!userCode) {
      this.toastService.show('Código inválido.', 'warning');
      return;
    }

    const request: EmployeeStoreSendInviteRequest = {
      storeId: this.store.id,
      userCode: userCode
    };

    this.employeeStoreService.sendInviteToEmployee(request).subscribe({
      next: (response) => {
        if (response.valid) {
          this.toastService.show(`Convite enviado!`, 'success');
          this.loadStoreInvites();
        } else {
          this.toastService.show(response.message, 'danger');
        }
      },
      error: (error) => {
        this.toastService.show('Erro ao enviar convite', 'danger');
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
          this.toastService.show(`Você agora está associado ao estabelecimento!`, 'success');
          this.loadEmployeeInvites();
        } else {
          this.toastService.show(response.message, 'danger');
        }
      },
      error: (error) => {
        loading.dismiss();
        this.toastService.show('Erro ao aceitar convite', 'danger');
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
          this.toastService.show(`Convite recusado`, 'warning');
          this.loadEmployeeInvites();
        } else {
          this.toastService.show(response.message, 'danger');
        }
      },
      error: (error) => {
        loading.dismiss();
        this.toastService.show('Erro ao recusar convite', 'danger');
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
          this.toastService.show(`Você não está mais associado ao estabelecimento`, 'warning');
          this.loadEmployeeInvites();
        } else {
          this.toastService.show(response.message, 'danger');
        }
      },
      error: (error) => {
        loading.dismiss();
        this.toastService.show('Erro ao sair do estabelecimento', 'danger');
      }
    });
  }

  async openInviteModal() {
    const alert = await this.alertController.create({
      header: 'Enviar Convite',
      subHeader: 'Informe o código do profissional',
      inputs: [
        {
          name: 'userCode',
          type: 'text',
          placeholder: 'Código interno',
          attributes: {
            maxlength: 50
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
            const userCode = data.userCode?.trim();

            if (!userCode) {
              this.toastService.show(
                'Código inválido.Por favor, informe o código do profissional.',
                'warning'
              );
              return false;
            }

            this.sendInvite(userCode);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }
}