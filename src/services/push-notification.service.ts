import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { DeviceService } from './device.service';
import { PlatformEnum } from 'src/models/enums/platform.enum';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {

  private initialized = false;

  constructor(
    private deviceService: DeviceService,
    private sessionStorage: SessionService
  ) {}

  async init(): Promise<void> {
    if (this.initialized) return;

    if (!Capacitor.isNativePlatform()) {
      console.log('Push ignorado (web)');
      return;
    }

    const user = this.sessionStorage.getUser();
    if (!user) {
      console.warn('Push não iniciado: usuário não logado');
      return;
    }

    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive !== 'granted') {
      const req = await PushNotifications.requestPermissions();
      if (req.receive !== 'granted') {
        console.warn('Permissão de push negada');
        return;
      }
    }

    PushNotifications.addListener('registration', token => {
      this.handleToken(token.value, user.id);
    });

    PushNotifications.addListener('registrationError', err => {
      console.error('Erro push:', err);
    });

    await PushNotifications.register();

    this.initialized = true;
  }

  private handleToken(token: string, userId: number): void {
    const savedToken = this.sessionStorage.getString('fcmToken');

    if (savedToken === token) {
      return;
    }

    this.sessionStorage.setString('fcmToken', token);

    this.deviceService
      .register(token, PlatformEnum.android, userId)
      .subscribe({
        next: () => console.log('Device registrado com sucesso'),
        error: err => {
          console.error('Erro ao registrar device', err);
          this.sessionStorage.removeGenericKey('fcmToken');
        }
      });
  }
}