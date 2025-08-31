import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { StoreModel } from 'src/models/store-model';
import { NotificationService } from 'src/services/notification.service';
import { SessionService } from 'src/services/session.service';
import { UserService } from 'src/services/user-service';

@Component({
  selector: 'app-footer-menu',
  templateUrl: './footer-menu.component.html',
  styleUrls: ['./footer-menu.component.scss'],
})
export class FooterMenuComponent implements OnInit {
  notificationsCount$!: Observable<number>;
  profile = 0;
  store: StoreModel | null = null;
  userFromSession: any;
  total: number = 0;

  constructor(
    private notificationService: NotificationService,
    private navController: NavController,
    private router: Router,
    private userService: UserService,
    private sessionService: SessionService,
    private cdr: ChangeDetectorRef
  ) {
    this.profile = this.sessionService.getProfile();
    this.store = this.sessionService.getStore();
  }

  ionViewWillEnter() {
    this.notificationsCount$ = this.notificationService.notificacoesNaoLidas$;
    this.loadUserQueInfo();


    this.notificationsCount$.subscribe(() => {
      this.cdr.detectChanges();
    });

    this.notificationService.atualizarContadorNaoLidas();
  }

  ngOnInit() {
  }

  async goToHome(main: boolean = false) {
    try {
      if (this.profile === 0) {
        this.router.navigate([main ? '/select-company' : '/queue'], {
          replaceUrl: true,
          state: { redirectedFromBack: true }
        });
      } else if (this.profile === 1) {
        this.router.navigate(
          [main && this.store?.releaseOrdersBeforeGetsQueued ? '/order-approval' : '/customer-list-in-queue'],
          { replaceUrl: true, state: { redirectedFromBack: true } }
        );
      } else if (this.profile === 2) {
        this.router.navigate(['/queue-list-for-owner'], {
          replaceUrl: true,
          state: { redirectedFromBack: true }
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      this.router.navigate(['/role-registration'], { replaceUrl: true });
    }
  }

  goToNotifications() {
    this.navController.navigateForward('/notification');
  }

  goToPromotions() {
    //this.navController.navigateForward('/promotions');
  }

  openMenu() {
    const menu = document.querySelector('ion-menu');
    menu?.open();
    window.dispatchEvent(new CustomEvent('menuOpened'));
  }

  loadUserQueInfo() {
    this.userFromSession = this.sessionService.getUser();

    if (this.userFromSession) {
      const userId = this.userFromSession.id;
      this.profile = this.sessionService.getProfile();

      this.userService.getUserInfoById(userId, this.profile).subscribe({
        next: (value) => {
          this.total = value.data;
        },
        error: (error) => {
          console.error('Erro ao buscar info do usuário:', error);
        }
      });
    }
  }
}