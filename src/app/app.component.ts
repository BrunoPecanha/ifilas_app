import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StatusBar } from '@capacitor/status-bar';
import { SignalRService } from 'src/services/seignalr.service';
import { NotificationService } from 'src/services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private signalRService: SignalRService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.signalRService.startNotificationConnection();

    this.platform.ready().then(() => {
      StatusBar.setOverlaysWebView({ overlay: false });
      StatusBar.setBackgroundColor({ color: '#f5f5f5' });
    });
  }
}
