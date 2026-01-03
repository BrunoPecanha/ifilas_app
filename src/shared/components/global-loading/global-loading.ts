import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { LoadingService } from 'src/services/loading.service';

@Component({
  selector: 'app-global-loading',
  template: ''
})
export class GlobalLoadingComponent implements OnInit, OnDestroy {

  private loadingEl?: HTMLIonLoadingElement;
  private sub?: Subscription;

  constructor(
    private loadingCtrl: LoadingController,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.sub = this.loadingService.loading$.subscribe(async (isLoading) => {
      if (isLoading && !this.loadingEl) {
        this.loadingEl = await this.loadingCtrl.create({
          spinner: 'crescent',
          message: 'Carregando...',
          backdropDismiss: false,
          keyboardClose: true,
          cssClass: 'global-loading'
        });
        await this.loadingEl.present();
      }

      if (!isLoading && this.loadingEl) {
        await this.loadingEl.dismiss();
        this.loadingEl = undefined;
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
