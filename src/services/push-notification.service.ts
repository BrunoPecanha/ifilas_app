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
  ) {}

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const user = this.sessionStorage.getUser();
    if (!user) {
      console.warn('Push não iniciado: usuário não logado');
      return;
    }

    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive !== 'granted') {
      const req = await PushNotifications.requestPermissions();
      if (req.receive !== 'granted') {
        console.warn('Permissão de push negada');
        return;
      }
    }

    PushNotifications.addListener('registration', (token: Token) => {      
      this.handleToken(token.value);
    });

    PushNotifications.addListener('registrationError', err => {
      console.error('Erro push:', err);
    });

    await PushNotifications.register();
  }

  /**
   * Registra token no backend
   */
  private handleToken(token: string): void {

    const savedToken = this.sessionStorage.getGenericKey('fcmToken');
    if (savedToken === token) {
      return;
    }

    this.sessionStorage.setGenericKey('fcmToken', token);

    this.deviceService
      .register(token, PlatformEnum.android)
      .subscribe({
        next: () => console.log('✅ Device registrado com sucesso'),
        error: err => {
          console.error('❌ Erro ao registrar device', err);

          this.sessionStorage.removeGenericKey('fcmToken');
        }
      });
  }
}
