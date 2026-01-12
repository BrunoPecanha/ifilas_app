import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'src/services/auth.service';
import { SessionService } from 'src/services/session.service';
import { PushNotificationService } from 'src/services/push-notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  isLoading: boolean = false;
  showPassword: boolean = false;
  password: string = '';
  email: string = '';
  appVersion: string = '1.0.0';

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private sessionService: SessionService,
    private alertController: AlertController,
    private pushService: PushNotificationService,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.sessionService.clearSessionData();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  openStartupWebsite() {
    // window.open('https://sua-startup.com', '_blank');
    console.log('Abrir site da startup');
  }

  onInputFocus(event: any) {
    const inputElement = event.target as HTMLElement;
    inputElement.parentElement?.parentElement?.classList.add('item-has-focus');
  }

  onInputBlur(event: any) {
    const inputElement = event.target as HTMLElement;
    const parentItem = inputElement.parentElement?.parentElement;

    if (parentItem) {
      parentItem.classList.remove('item-has-focus');

      const inputValue = (event.detail?.value || '').trim();
      if (inputValue) {
        parentItem.classList.add('item-has-value');
      } else {
        parentItem.classList.remove('item-has-value');
      }
    }
  }

  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const { email, password } = this.loginForm.value;

      const response = await firstValueFrom(this.authService.login({
        email: email.trim(),
        password: password.trim()
      }));

      if (response && response.valid && response?.data.token && response.data?.user) {
        this.sessionService.setToken(response.data.token);
        this.sessionService.setUser(response.data.user);

        await this.pushService.init();
        this.router.navigate(['/role-registration']);
      } else {
        await this.showAlert('Credenciais inválidas. Verifique seus dados.');
      }
    } catch (error) {
      console.error('Erro no login', error);
      await this.showAlert('Erro ao tentar fazer login. Verifique sua conexão e tente novamente.');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAppConfig() {
    // Exemplo:
    // this.appVersion = await this.configService.getAppVersion();
    // this.appName = await this.configService.getAppName();
    // this.showSupportLinks = await this.configService.shouldShowSupportLinks();
  }

  private async showAlert(message: string, title: string = 'Atenção') {
    const alert = await this.alertController.create({
      header: title,
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

  resetForm() {
    this.loginForm.reset();
    this.showPassword = false;
  }
}