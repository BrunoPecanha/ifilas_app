import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Subscription, Observable } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { NotificationService } from 'src/services/notification.service';
import { SessionService } from 'src/services/session.service';
import { UserService } from 'src/services/user-service';
import { NavegationHistoryService } from 'src/services/navegation-history.service';

@Component({
  selector: 'app-custom-header',
  templateUrl: './custom-header.component.html',
  styleUrls: ['./custom-header.component.scss']
})
export class CustomHeaderComponent implements OnInit, OnDestroy {
  @Input() title: string = '';
  @Input() subtitle?: string;

  @Input() showStartButton: boolean = false;
  @Input() startIconName: string = 'arrow-back';
  @Input() startButtonClass: string = 'start-button';
  @Input() startDisabled: boolean = false;
  @Input() startLoading: boolean = false;
  @Output() onStartClick = new EventEmitter<void>();

  @Input() showEndButton: boolean = true;
  @Input() endIconName: string = 'add';
  @Input() endButtonClass: string = 'end-button';
  @Input() endDisabled: boolean = false;
  @Input() endLoading: boolean = false;
  @Output() onEndClick = new EventEmitter<void>();
  @Input() hideSubtitle: boolean = false;

  @Input() showPausePlayButton: boolean = false;
  @Input() isPaused: boolean = false;
  @Output() onPausePlayClick = new EventEmitter<void>();

  @Input() routeLink: string = '';
  @Input() notificationCount?: number | null;
  @Input() showNotificationBadge: boolean = false;

  notificationCount$!: Observable<number>;

  profile: any;
  userFromSession: any;

  private notificationsSubscription?: Subscription;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private sessionService: SessionService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private history: NavegationHistoryService
  ) {
    this.profile = this.sessionService.getProfile();
  }

  ngOnInit(): void {
    this.notificationCount$ = this.notificationService.notificacoesNaoLidas$;

    if (this.notificationCount === undefined || this.notificationCount === null) {
      this.notificationsSubscription = this.notificationCount$.subscribe(count => {
        this.notificationCount = count;
        this.cdr.detectChanges();
      });
    }

    this.notificationService.atualizarContadorNaoLidas();
  }

  ngOnDestroy(): void {
    this.notificationsSubscription?.unsubscribe();
  }

  private ensureNotificationSubscriptionIfNeeded() {
    if (this.notificationCount === undefined || this.notificationCount === null) {
      this.notificationsSubscription = this.notificationService.notificacoesNaoLidas$
        .subscribe((count: number) => {
          this.notificationCount = count;
          this.cdr.detectChanges();
        });
    }
  }

  handleStartButtonClick() {
    if (this.isBackButton() && !this.startDisabled && !this.startLoading) {
      this.goBack();
    } else if (!this.startLoading) {
      this.onStartClick.emit();
    }
  }

  private isBackButton(): boolean {
    return ['arrow-back', 'arrow-back-outline', 'chevron-back', 'chevron-back-outline'].includes(this.startIconName);
  }

  async goBack() {
    try {
      const previous = this.history.back();
      if (previous) {
        this.router.navigateByUrl(previous, { replaceUrl: true, state: { redirectedFromBack: true } });
        return;
      }

      const route =
        this.routeLink ||
        (this.profile === 0
          ? '/queue'
          : this.profile === 1
            ? '/customer-list-in-queue'
            : '/queue-list-for-owner');

      this.router.navigate([route], { replaceUrl: true, state: { redirectedFromBack: true } });
    } catch (error) {
      this.router.navigate(['/role-registration'], { replaceUrl: true });
    }
  }

  onEndButtonClick() {
    this.onEndClick.emit();
    this.goToNotifications();
  }

  private goToNotifications() {
    try {
      this.navCtrl.navigateForward('/notification');
    } catch (err) {
      console.error('Navigation error to notifications:', err);
      this.router.navigate(['/notification']);
    }
  }

  hasNotifications(): boolean {
    return !!(this.notificationCount && this.notificationCount > 0);
  }

  displayNotificationText(): string {
    if (!this.notificationCount)
      return '';
    return this.notificationCount > 99 ? '99+' : String(this.notificationCount);
  }
}
