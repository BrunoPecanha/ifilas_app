import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'src/services/auth.service';
import { SessionService } from 'src/services/session.service';
import { StoreListResponse } from 'src/models/responses/store-list-response';
import { PushNotificationService } from 'src/services/push-notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  userStores: StoreListResponse | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sessionService: SessionService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private pushService: PushNotificationService
  ) { }

  ngOnInit() {
    this.sessionService.clearSessionData();
  }

  async login() {
    if (this.email.trim() && this.password.trim()) {
      let loading: HTMLIonLoadingElement | null = null;
      try {
        loading = await this.loadingController.create({
          message: 'Verificando suas credenciais...',
          spinner: 'crescent',
        });
        

        const response = await firstValueFrom(this.authService.login({
          email: this.email,
          password: this.password
        }));

        if (response && response.valid && response?.data.token && response.data?.user) {
          this.sessionService.setToken(response?.data.token);
          this.sessionService.setUser(response?.data.user);

          await this.pushService.init();
          this.router.navigate(['/role-registration']);
        }
      }
      catch (error) {
        console.error('Erro no login', error);
        await this.showAlert('Erro ao tentar fazer login. Verifique seus dados.');
      } finally {
        
      }
    } else {
      await this.showAlert('Email e senha são obrigatórios.');
    }
  }

  private async showAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Aviso',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}