import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { StoreModel } from 'src/models/store-model';
import { NotificationService } from 'src/services/notification.service';
import { SessionService } from 'src/services/session.service';
import { UserService } from 'src/services/user-service';

@Component({
  selector: 'app-footer-menu',
  templateUrl: './footer-menu.component.html',
  styleUrls: ['./footer-menu.component.scss'],
})
export class FooterMenuComponent implements OnInit, OnDestroy {
  notificationsCount$!: Observable<number>;
  profile = 0;
  store: StoreModel | null = null;
  userFromSession: any;
  total: number = 0;
  activeButton: string = 'home';
  private notificationsSubscription!: Subscription;
  private routerSubscription!: Subscription;

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

  ngOnInit() {
    this.loadUserQueInfo();
    this.initializeNotifications();
    this.setActiveBasedOnRoute();
    this.setupRouterListener();

    this.sessionService.user$.subscribe(user => {
      this.userFromSession = user;
    });

    this.sessionService.profile$.subscribe(profile => {
      this.profile = profile;
    });

    this.sessionService.store$.subscribe(store => {
      this.store = store;
    });
  }

  ngOnDestroy() {
    if (this.notificationsSubscription) {
      this.notificationsSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  setupRouterListener() {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.setActiveBasedOnRoute();
        this.cdr.detectChanges();
      });
  }

  setActiveBasedOnRoute() {
    const currentUrl = this.router.url;

    if (currentUrl.includes('/notification')) {
      this.activeButton = 'notifications';
    } else if (currentUrl.includes('/select-company') || currentUrl.includes('/queue') ||
      currentUrl.includes('/order-approval') || currentUrl.includes('/customer-list-in-queue') ||
      currentUrl.includes('/owner-schedule') || currentUrl.includes('/queue-list-for-owner')) {
      this.activeButton = 'home';
    } else if (currentUrl.includes('/promotions')) {
      this.activeButton = 'cart';
    } else {
      this.activeButton = 'home';
    }
  }

  initializeNotifications() {
    this.notificationsCount$ = this.notificationService.notificacoesNaoLidas$;

    this.notificationsSubscription = this.notificationsCount$.subscribe(() => {
      this.cdr.detectChanges();
    });

    this.notificationService.atualizarContadorNaoLidas();
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
          [main && this.store?.releaseOrdersBeforeGetsQueued ? '/order-approval' : !this.userFromSession.useAgenda ? '/customer-list-in-queue' : '/owner-schedule'],
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
    this.activeButton = 'notifications';
    this.cdr.detectChanges();
    this.navController.navigateForward('/notification');
  }

  goToPromotions() {
    this.activeButton = 'cart';
    this.cdr.detectChanges();
    //this.navController.navigateForward('/promotions');
  }

  setActive(button: string) {
    this.activeButton = button;
    this.cdr.detectChanges();
  }

  openMenu() {
    this.activeButton = 'menu';
    this.cdr.detectChanges();
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
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao buscar info do usuário:', error);
        }
      });
    }
  }
}