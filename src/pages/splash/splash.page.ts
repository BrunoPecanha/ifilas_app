import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from 'src/services/session.service';
import { AuthService } from 'src/services/auth.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss']
})
export class SplashPage {
  private triedAutoLogin = false;


  constructor(
    private router: Router,
    private sessionService: SessionService,
    private authService: AuthService,
    private ngZone: NgZone
  ) { }

  ionViewDidEnter() {
    if (!this.triedAutoLogin) {
      this.triedAutoLogin = true;

      setTimeout(() => {
        this.tryAutoLogin();
      }, 5000);

    } else {
      this.clearSessionAndLogout();
    }
  }

  async tryAutoLogin() {
    try {

      const response = await this.authService.refreshToken().toPromise();

      if (response && response.valid && response?.data.token && response.data?.user) {
        this.sessionService.setToken(response.data.token);
        this.sessionService.setUser(response.data.user);
        this.sessionService.setRefreshToken(response.data.refreshToken);

        this.ngZone.run(() => {
          this.router.navigate(['/role-registration']);
        });
        return;
      }
    } catch {
      this.clearSessionAndLogout();
    }
  }

  private clearSessionAndLogout() {
    this.sessionService.clearSessionData();
    this.ngZone.run(() => {
      this.router.navigate(['/login']);
    });
  }
}