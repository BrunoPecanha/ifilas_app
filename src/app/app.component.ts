import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { LoadingService } from 'src/services/loading.service';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  loading$ = this.loadingService.isLoading$;

  constructor(private platform: Platform, private loadingService: LoadingService) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();
    await this.configureStatusBar();
  }

  private async configureStatusBar() {
    if (!Capacitor.isPluginAvailable('StatusBar')) return;

    const platform = Capacitor.getPlatform();

    if (platform === 'android') {
      await StatusBar.show();    
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Default });
    }

    if (platform === 'ios') {
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Default });
    }
  }
}