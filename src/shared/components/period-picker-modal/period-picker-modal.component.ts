import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-period-picker-modal',
  template: `
    <ion-content [fullscreen]="true" class="custom-content">
      <app-custom-header
        [subtitle]="'PERÍODO'"
        [showStartButton]="true"
        (onStartClick)="close()"
        startIconName="close-outline"
        [showEndButton]="true"
        endIconName="checkmark"
        (onEndClick)="confirm()"
      ></app-custom-header>

      <div class="content-wrapper">
        <div class="datetime-container">
          <ion-datetime
            presentation="date"
            [value]="startDate"
            (ionChange)="onStartDateChange($event)"
          ></ion-datetime>
          <p class="label">Data de Início</p>

          <ion-datetime
            presentation="date"
            [value]="endDate"
            (ionChange)="onEndDateChange($event)"
          ></ion-datetime>
          <p class="label">Data de Fim</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .custom-content {
      --background: var(--ion-background-color, #ffffff);
      padding: 16px 8px;
    }

    .content-wrapper {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      padding-bottom: 32px;
      padding-top: 30px;
    }

    .datetime-container {
      width: 100%;
      max-width: 420px;
    }

    ion-datetime {
      width: 100%;
      margin: 0 auto 16px;
      --background: var(--ion-item-background, #f8f9fa);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .label {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
      text-align: center;
      margin: -12px 0 16px;
    }

    ion-content::part(scroll) {
    scrollbar-width: none;
      -ms-overflow-style: none;
    }

    @media (min-width: 768px) {
      .content-wrapper {
        padding-bottom: 16px;
      }
    }
  `]
})
export class PeriodPickerModalComponent {
  @Input() startDate: string = new Date().toISOString();
  @Input() endDate: string = new Date().toISOString();

  constructor(private modalController: ModalController) {}

  onStartDateChange(event: any) {
    this.startDate = event.detail.value;
  }

  onEndDateChange(event: any) {
    this.endDate = event.detail.value;
  }

  confirm() {
    this.modalController.dismiss({
      startDate: this.startDate,
      endDate: this.endDate,
    });
  }

  close() {
    this.modalController.dismiss();
  }
}
