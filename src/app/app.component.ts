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

    // this.configureIonicSafeArea();
    await this.configureStatusBar();
  }

  // private configureIonicSafeArea() {
  //   document.documentElement.style.setProperty('--ion-safe-area-top', 'var(--ion-statusbar-padding)');
  //   document.documentElement.style.setProperty('--ion-safe-area-bottom', 'var(--ion-safe-area-bottom, 0px)');
  // }

  async onMenuOpen() {
    await StatusBar.setStyle({ style: Style.Dark });
  }

  async onMenuClose() {
    await StatusBar.setStyle({ style: Style.Light });
  }

  private async configureStatusBar() {
    if (!Capacitor.isPluginAvailable('StatusBar')) {
      return;
    }

    const platform = Capacitor.getPlatform();

    if (platform === 'android') {
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
      await StatusBar.setStyle({ style: Style.Dark });

    } else if (platform === 'ios') {
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Default });
    }
  }
}