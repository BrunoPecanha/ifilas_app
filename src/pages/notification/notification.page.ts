import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActionSheetButton } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { UserModel } from 'src/models/user-model';
import { NotificationService } from 'src/services/notification.service';
import { SessionService } from 'src/services/session.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.page.html',
  styleUrls: ['./notification.page.scss'],
})
export class NotificationPage implements OnInit, OnDestroy {
  activeFilter: 'all' | 'unread' = 'all';
  actionSheetOpen = false;

  notifications: any[] = [];
  notificacoesNaoLidas = 0;
  user!: UserModel;

  private subscriptions: Subscription[] = [];

  actionSheetButtons: ActionSheetButton[] = [
    {
      text: 'Marcar todas como lidas',
      icon: 'checkmark-done-outline',
      handler: () => this.markAllAsRead()
    },
    {
      text: 'Limpar notificações',
      icon: 'trash-outline',
      role: 'destructive',
      handler: () => this.clearNotifications()
    },
    {
      text: 'Cancelar',
      icon: 'close-outline',
      role: 'cancel'
    }
  ];

  constructor(
    private navCtrl: NavController,
    private notificationService: NotificationService,
    private sessionService: SessionService
  ) {
    this.user = this.sessionService.getUser();
    if (!this.user) {
      this.navCtrl.navigateRoot('/login');
    }
  }

  ngOnInit() {
    this.loadNotifications();

    const sub = this.notificationService.notificacoes$.subscribe(nots => {
      this.notifications = nots.map(n => ({
        ...n,
        expanded: false,
        data: new Date(n.sentAt ?? Date.now())
      }));
    });
    this.subscriptions.push(sub);

  }

  ionViewDidEnter() {
    setTimeout(() => {
      this.markAllAsRead();
    }, 2000);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  async loadNotifications() {
    this.notificationService.getUserNotifications(this.user.id).subscribe(notifs => {
      this.notifications = notifs.map(n => ({
        ...n,
        expanded: false,
        data: new Date(n.sentAt ?? Date.now())
      }));
      this.notificationService.atualizarContadorNaoLidas();
    });
  }

  getNotificationTime(sentAt: string | Date): string {
    const sentDate = new Date(sentAt);
    const now = new Date();

    const diffMs = now.getTime() - sentDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'Agora';
    }

    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    }

    if (diffHours < 24) {
      return `${diffHours} h`;
    }

    if (diffDays === 1) {
      return 'Ontem';
    }

    return `${diffDays} dias`;
  }

  get filteredNotifications() {
    return this.notifications
      .filter(noti => {
        if (this.activeFilter === 'all') return true;
        if (this.activeFilter === 'unread') return !noti.isRead;
        return true;
      })
      .sort((a, b) => b.data.getTime() - a.data.getTime());
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      'system': 'notifications-outline',
      'promo': 'pricetag-outline',
      'appointment': 'calendar-outline',
      'default': 'notifications-outline'
    };
    return icons[type] || icons['default'];
  }

  toggleNotification(notification: any) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(+notification.id).subscribe(() => {
        notification.isRead = true;
        this.notificationService.atualizarContadorNaoLidas();
      });
    } else {
      notification.isRead = false;
      this.notificationService.atualizarContadorNaoLidas();
    }
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(noti => noti.id !== id);
    this.notificationService.deleteNotification(+id).subscribe();
    this.notificationService.atualizarContadorNaoLidas();
  }

  markAllAsRead() {
    this.notificationService
      .markAllAsRead(this.user.id)
      .subscribe();
  }

  clearNotifications() {
    this.notifications.forEach(noti => this.notificationService.deleteNotification(+noti.id).subscribe());
    this.notifications = [];
    this.notificationService.atualizarContadorNaoLidas();
  }

  filterChanged(event: any) {
    this.activeFilter = event.detail.value;
  }

  openNotificationMenu() {
    this.actionSheetOpen = true;
  }

  async handleRefresh(event: any) {
    try {
      await this.loadNotifications();
    } finally {
      event.target.complete();
    }
  }

  back() {
    this.navCtrl.back();
  }

  toggleExpand(notification: any) {
    notification.expanded = !notification.expanded;
  }

}