import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from 'src/services/auth.service';
import { SessionService } from 'src/services/session.service';

@Component({
  selector: 'app-generate-password',
  templateUrl: './generate-password.page.html',
  styleUrls: ['./generate-password.page.scss'],
})
export class GeneratePasswordPage {
  email: string = '';

  constructor(private router: Router, private alertController: AlertController,
    private authService: AuthService, private sessionService: SessionService) { }

  async onSubmit() {
    if (!this.email) {
      return;
    }

    this.sessionService.setGenericKey({ email: this.email, newUser: false }, 'pendingUser',);

    this.authService.generateNewCodeForValidate(this.email).subscribe({
      next: async () => {
        const alert = await this.alertController.create({
          header: 'Enviado',
          message: 'Se o email estiver correto, o código foi enviado para sua caixa de entrada',
          buttons: [
            {
              text: 'OK',
              handler: () => {
                this.router.navigate(['/validate-code']);
              }
            }
          ],
        });

        await alert.present();
      },
      error: async () => {
        const alert = await this.alertController.create({
          header: 'Erro',
          message: 'Não foi possível enviar o código. Tente novamente.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }
}