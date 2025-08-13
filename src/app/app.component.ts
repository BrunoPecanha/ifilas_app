import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StatusBar } from '@capacitor/status-bar';
import { SignalRService } from 'src/services/seignalr.service';
import { PushNotificationService } from 'src/services/push-notification.service';
import { SessionService } from 'src/services/session.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private signalRService: SignalRService,
    private pushService: PushNotificationService,
    private session: SessionService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.signalRService.startNotificationConnection();

    this.platform.ready().then(() => {
      document.body.classList.remove('dark');

      StatusBar.setOverlaysWebView({ overlay: false });
      StatusBar.setBackgroundColor({ color: '#f5f5f5' });
    });
    
    const isLoggedIn = !!this.session.getToken();
    if (isLoggedIn) {
      this.pushService.init();
    }
  }
}
