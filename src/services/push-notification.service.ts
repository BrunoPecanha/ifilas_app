import { Injectable } from '@angular/core';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { DeviceService } from './device.service';
import { PlatformEnum } from 'src/models/enums/platform.enum';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {

  private initialized = false;

  constructor(
    private deviceService: DeviceService,
    private sessionStorage: SessionService
  ) { }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive !== 'granted') {
      const req = await PushNotifications.requestPermissions();
      if (req.receive !== 'granted') {
        console.warn('Permissão de push negada');
        return;
      }
    }

    PushNotifications.addListener('registration', (token: Token) => {
      console.log('🔥 FCM TOKEN:', token.value);
      this.handleToken(token.value);
    });

    PushNotifications.addListener('registrationError', err => {
      console.error('❌ ERRO PUSH:', JSON.stringify(err));
    });

    await PushNotifications.register();
  }

  private handleToken(token: string) {
    const savedToken = this.sessionStorage.getGenericKey('fcmToken');
    if (savedToken === token) return;

    this.sessionStorage.setGenericKey('fcmToken', token);

    this.deviceService
      .register(token, PlatformEnum.android)
      .subscribe({
        error: err => console.error('Erro ao registrar device', err)
      });
  }
}
