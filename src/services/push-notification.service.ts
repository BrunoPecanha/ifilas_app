import { Injectable } from '@angular/core';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { DeviceService } from './device.service';
import { PlatformEnum } from 'src/models/enums/platform.enum';
import { SessionService } from './session.service';
import { UserModel } from 'src/models/user-model';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {

  user: UserModel = {} as UserModel;
  
  constructor(
    private deviceService: DeviceService,
    private sessionStorage: SessionService
  ) {

    this.user = this.sessionStorage.getUser() as UserModel;
  }

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
      const savedToken = this.sessionStorage.getGenericKey('fcmToken');

      if (savedToken === token.value) return;

      this.sessionStorage.setGenericKey('fcmToken', token.value);

      this.deviceService
        .register(token.value, PlatformEnum.android)
        .subscribe();
    });

    PushNotifications.addListener('registrationError', err => {
      console.error('Erro ao registrar push:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('Notificação recebida (foreground):', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', action => {
      console.log('Ação da notificação:', action);
    });
  }

  clearTokenOnLogout() {
    const token = this.sessionStorage.getGenericKey('fcmToken');
    if (!token) return;

    this.deviceService.unregister(token, this.user.id).subscribe({
      next: () => console.log('Token removido do backend'),
      error: err => console.error('Erro ao remover token', err)
    });

    this.sessionStorage.removeGenericKey('fcmToken');
  }
}
