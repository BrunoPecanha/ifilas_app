import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { StatusQueueEnum } from 'src/models/enums/status-queue.enum';
import { ProfessionalModel } from 'src/models/professional-model';
import { StoreProfessionalModel } from 'src/models/store-professional-model';
import { UserModel } from 'src/models/user-model';
import { SignalRService } from 'src/services/seignalr.service';
import { SessionService } from 'src/services/session.service';
import { StoresService } from 'src/services/stores.service';

@Component({
  selector: 'app-select-professional',
  templateUrl: './select-professional.page.html',
  styleUrls: ['./select-professional.page.scss'],
})
export class SelectProfessionalPage implements OnInit, OnDestroy {
  store: StoreProfessionalModel | null = null;
  storeId: number = 0;
  StatusQueueEnum = StatusQueueEnum;
  signalRGroup: string = '';
  bannerLoaded = false;
  logoLoaded = false;
  user: UserModel = {} as UserModel;

  filterType: 'all' | 'queue' | 'agenda' = 'all';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: StoresService,
    private alertController: AlertController,
    private signalRService: SignalRService,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    this.getSelectedStoreId();
    this.resetImageStates();
    this.loadStoreAndProfessionals(this.storeId);
    this.user = this.sessionService.getUser();
  }

  ngOnDestroy() {
    this.cleanupSignalR();
  }

  ionViewWillEnter() {
    this.initSignalRConnection();
  }

  get queueProfessionals(): ProfessionalModel[] {
    const professionals = this.store?.professionals || [];
    var teste = professionals.filter(p => !p.useAgenda);

    debugger

    return teste;
  }

  get agendaProfessionals(): ProfessionalModel[] {
    const professionals = this.store?.professionals || [];
    return professionals.filter(p => p.useAgenda);
  }

  get filteredProfessionals(): ProfessionalModel[] {
    switch (this.filterType) {
      case 'queue':
        return this.queueProfessionals;
      case 'agenda':
        return this.agendaProfessionals;
      default:
        return this.store?.professionals || [];
    }
  }

  get hasQueueProfessionals(): boolean {
    return this.queueProfessionals.length > 0 && this.filterType !== 'agenda';
  }

  get hasAgendaProfessionals(): boolean {
    return this.agendaProfessionals.length > 0 && this.filterType !== 'queue';
  }

  get hasAnyProfessionals(): boolean {
    return this.filteredProfessionals.length > 0;
  }

  loadStoreAndProfessionals(storeId: number) {
    this.service.loadStoreAndProfessionals(storeId).subscribe({
      next: (response) => {
        this.store = response.data;

        if (this.store && this.store.professionals) {
          const isProfessional = this.store.professionals.some(
            (prof) => prof.id === this.user.id
          );

          if (isProfessional) {
            this.store.professionals = this.store.professionals.filter(
              (prof) => prof.id !== this.user.id
            );
          }

          this.store.professionals = this.store.professionals.map(prof => ({
            ...prof,
            profileImage: prof.profileImage || prof.photoUrl || 'assets/images/utils/default-avatar.png',
            customersWaiting: prof.customersWaiting || 0,
            averageWaitingTime: prof.averageWaitingTime || '00:00:00',
            servicesProvided: prof.servicesProvided || 'Serviços diversos',
            rating: prof.rating || 0,
            numberOfRatings: prof.numberOfRatings || 0,
            queueName: prof.queueName || (prof.useAgenda ? 'Agendamento' : 'Atendimento Geral')
          }));
        }

        this.sessionService.setStore(this.store);
      },
      error: (err) => {
        console.error('Erro ao carregar profissionais:', err);
      },
    });
  }

  getSelectedStoreId() {
    this.route.queryParams.subscribe((params) => {
      this.storeId = params['storeId'];
    });
  }

  getStatusClass(status: StatusQueueEnum): string {
    switch (status) {
      case StatusQueueEnum.open:
        return 'active';
      case StatusQueueEnum.paused:
        return 'paused';
      case StatusQueueEnum.closed:
        return 'closed';
      default:
        return '';
    }
  }

  getStatusText(status: StatusQueueEnum, useAgenda: boolean): string {
    switch (status) {
      case StatusQueueEnum.open:
        return useAgenda ? 'Disponível' : 'Aberta';
      case StatusQueueEnum.paused:
        return useAgenda ? 'Indisponível' : 'Pausada';
      case StatusQueueEnum.closed:
        return useAgenda ? 'Indisponível' : 'Fechada';
      default:
        return useAgenda ? 'Disponível' : 'Aberta';
    }
  }

  getStatusIcon(status: StatusQueueEnum): string {
    switch (status) {
      case StatusQueueEnum.open:
        return 'checkmark-circle';
      case StatusQueueEnum.paused:
        return 'pause-circle';
      case StatusQueueEnum.closed:
        return 'close-circle';
      default:
        return 'checkmark-circle';
    }
  }

  private async initSignalRConnection() {
    try {
      await this.signalRService.startQueueConnection();

      this.signalRGroup = this.storeId.toString();

      await this.signalRService.joinQueueGroup(this.signalRGroup);

      this.signalRService.onUpdateQueue(() => {
        this.loadStoreAndProfessionals(this.storeId);
      });
    } catch (error) {
      console.error('Erro SignalR (loja):', error);
      setTimeout(() => this.initSignalRConnection(), 5000);
    }
  }

  async handleRefresh(event: any) {
    try {
      this.getSelectedStoreId();
      this.loadStoreAndProfessionals(this.storeId);
    } finally {
      event.target.complete();
    }
  }

  private cleanupSignalR() {
    this.signalRService.offUpdateQueue();
    if (this.signalRGroup) {
      this.signalRService.leaveQueueGroup(this.signalRGroup);
    }
  }

  async getInTheQueue(professional: ProfessionalModel) {
    debugger
    try {
      if (professional.status !== StatusQueueEnum.open) {
        await this.presentAlert(
          'Atendimento Indisponível', 
          'Este profissional não está disponível no momento.'
        );
        return;
      }

      const isCostumerInQueue = await this.service
        .isCostumerInQueue(professional.queueId, this.user.id)
        .toPromise();

      if (isCostumerInQueue?.data) {
        this.router.navigate(['/queue']);
      } else {
        this.router.navigate(['/select-services'], {
          queryParams: {
            queueId: professional.queueId,
            storeId: this.storeId,
            professionalId: professional.id,
            useAgenda: false,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao entrar na fila:', error);
      await this.presentAlert(
        'Erro', 
        'Não foi possível acessar a fila. Tente novamente.'
      );
    }
  }

  async openAgenda(professional: ProfessionalModel) {
    debugger
    try {
      if (professional.status !== StatusQueueEnum.open) {
        await this.presentAlert(
          'Agenda Indisponível', 
          'Este profissional não está disponível para agendamento no momento.'
        );
        return;
      }

      this.router.navigate(['/select-services'], {
        queryParams: {
          professionalId: professional.id,
          storeId: this.storeId,
          useAgenda: true,
        },
      });
    } catch (error) {
      console.error('Erro ao abrir agenda:', error);
      await this.presentAlert(
        'Erro', 
        'Não foi possível acessar a agenda. Tente novamente.'
      );
    }
  }

  toggleLike(prof: ProfessionalModel, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    prof.liked = !prof.liked;
    
    // implementar a chamada API para salvar o like
    // this.service.toggleProfessionalLike(prof.id, prof.liked).subscribe();
  }

  openStoreDetails() {
    this.router.navigate(['/store-details', this.storeId]);
  }

  async openPauseReason(professional: ProfessionalModel, event: Event) {
    event.stopPropagation();

    const motivo = professional.pauseReason || 
      (professional.useAgenda 
        ? 'O atendimento por agenda está temporariamente indisponível.' 
        : 'A fila está temporariamente pausada.');

    const alert = await this.alertController.create({
      header: professional.useAgenda ? 'Indisponível' : 'Em Pausa',
      message: 'Motivo: ' + motivo,
      buttons: ['Entendi'],
    });

    await alert.present();
  }

  getQueueProgress(qtdPessoas: number): number {
    const maxPessoas = 10;
    const progresso = (qtdPessoas / maxPessoas) * 100;
    
    return Math.min(progresso, 100);
  }

  getColorProgress(qtdPessoas: number): string {
    if (qtdPessoas <= 3) 
      return '#4caf50';
    if (qtdPessoas <= 7) 
      return '#ff9800';
    
    return '#f44336';
  }

  getQueueStatusText(qtdPessoas: number): string {
    if (qtdPessoas === 0) 
      return 'Fila vazia';
    if (qtdPessoas <= 3) 
      return 'Fila leve';
    if (qtdPessoas <= 7) 
      return 'Fila moderada';
    
    return 'Fila cheia';
  }

  resetImageStates() {
    this.bannerLoaded = false;
    this.logoLoaded = false;
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, index) => index + 1);
  }

  getStarIcon(starIndex: number, rating: number): string {
    return starIndex <= rating ? 'star' : 'star-outline';
  }

  setFilter(type: 'all' | 'queue' | 'agenda') {
    this.filterType = type;
  }

  isFilterActive(type: 'all' | 'queue' | 'agenda'): boolean {
    return this.filterType === type;
  }

  getProfessionalsCountText(): string {
    const total = this.filteredProfessionals.length;
    
    switch (this.filterType) {
      case 'queue':
        return `${total} atendente${total !== 1 ? 's' : ''} com fila`;
      case 'agenda':
        return `${total} atendente${total !== 1 ? 's' : ''} com agenda`;
      default:
        return `${total} atendente${total !== 1 ? 's' : ''} disponível${total !== 1 ? '(s)' : ''}`;
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

  handleImageError(event: any) {
    event.target.src = 'assets/images/utils/default-avatar.png';
  }

  formatWaitingTime(timeString: string): string {
    if (!timeString || timeString === '00:00:00') return '--';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
      return totalMinutes > 0 ? `${totalMinutes} min` : '--';
    } catch {
      return '--';
    }
  }

  shouldShowRating(professional: ProfessionalModel): boolean {
    return !!(professional.rating && professional.rating > 0);
  }
}