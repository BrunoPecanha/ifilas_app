import { Injectable } from '@angular/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { DeviceService } from './device.service';
import { PlatformEnum } from 'src/models/enums/platform.enum';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  constructor(private deviceService: DeviceService, sessionStorage: SessionService) { }

  async init() {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive !== 'granted') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') {
      console.warn('Permissão de push negada');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token: Token) => {
      sessionStorage.setItem('fcmToken', token.value);
      this.deviceService.register(token.value, PlatformEnum.android).subscribe();
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Erro ao registrar push:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Notificação recebida (foreground):', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Ação da notificação:', action);
    });
  }

  async clearTokenOnLogout() {
    const token = sessionStorage.getItem('fcmToken');
    if (token) {
      this.deviceService.unregister(token).subscribe({
        next: () => console.log('Token removido do backend'),
        error: (err) => console.error('Erro ao remover token do backend', err)
      });
      sessionStorage.removeItem('fcmToken');   
    }
  }
}
