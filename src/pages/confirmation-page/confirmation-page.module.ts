import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConfirmationPagePageRoutingModule } from './confirmation-page-routing.module';

import { ConfirmationPage } from './confirmation-page.page';
import { SharedModule } from 'src/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    IonicModule,
    ConfirmationPagePageRoutingModule
  ],
  declarations: [ConfirmationPage]
})
export class ConfirmationPagePageModule {}
