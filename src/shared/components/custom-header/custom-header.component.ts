import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { SessionService } from 'src/services/session.service';

@Component({
  selector: 'app-custom-header',
  templateUrl: './custom-header.component.html',
  styleUrls: ['./custom-header.component.scss']
})
export class CustomHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;

  @Input() showStartButton: boolean = false;
  @Input() startIconName: string = 'arrow-back';
  @Input() startButtonClass: string = 'start-button';
  @Input() startDisabled: boolean = false;
  @Input() startLoading: boolean = false;
  @Output() onStartClick = new EventEmitter<void>();

  @Input() showEndButton: boolean = true;
  @Input() endIconName: string = 'add';
  @Input() endButtonClass: string = 'end-button';
  @Input() endDisabled: boolean = false;
  @Input() endLoading: boolean = false;
  @Output() onEndClick = new EventEmitter<void>();
  @Input() hideSubtitle: boolean = false;

  @Input() showPausePlayButton: boolean = false;
  @Input() isPaused: boolean = false;
  @Output() onPausePlayClick = new EventEmitter<void>();

  @Input() routeLink: string = '';

  profile: any;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private sessionService: SessionService
  ) {
    this.profile = this.sessionService.getProfile();
  }

  handleStartButtonClick() {
    if (this.isBackButton() && !this.startDisabled && !this.startLoading) {
      this.goBack();
    } else if (!this.startLoading) {
      this.onStartClick.emit();
    }
  }

  private isBackButton(): boolean {
    return ['arrow-back', 'arrow-back-outline', 'chevron-back', 'chevron-back-outline'].includes(this.startIconName);
  }

  private async goBack() {
    try {
      const canGoBack = await this.navCtrl.pop();

      if (!canGoBack) {
        const route = this.routeLink || (this.profile === 0 ? '/queue' : this.profile === 1 ? '/customer-list-in-queue' : 'queue-list-for-owner');
        this.router.navigate([route], {
          replaceUrl: true,
          state: { redirectedFromBack: true }
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      this.router.navigate(['/role-registration'], { replaceUrl: true });
    }
  }
}
