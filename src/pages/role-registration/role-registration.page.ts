import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { UserProfileEnum } from 'src/models/enums/user-profile.enum';
import { UserModel } from 'src/models/user-model';
import { SessionService } from 'src/services/session.service';

@Component({
  selector: 'app-role-registration',
  templateUrl: './role-registration.page.html',
  styleUrls: ['./role-registration.page.scss'],
})
export class RoleRegistrationPage implements OnInit {

  user: UserModel | undefined;

  constructor(private router: Router, private sessionService: SessionService, private alertController: AlertController) { }

  ngOnInit() {
    this.checkUser();
  }

  ionViewWillEnter() {
    this.checkUser();
  }

  private checkUser(): void {
    this.user = this.sessionService.getUser();

    if (this.user?.profile === UserProfileEnum.customer) {
      this.sessionService.setProfile(this.user.profile);
      this.router.navigate(['/select-company']);
    }
  }


  async exit() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: 'Tem certeza que deseja sair?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Sair',
          handler: () => {
            this.sessionService.logout();
          },
        },
      ],
    });

    await alert.present();
  }

  redirect(rota: string, profile: number) {
    if (profile >= 0)
      this.sessionService.setProfile(profile)
    this.router.navigate([rota]);
  }
}