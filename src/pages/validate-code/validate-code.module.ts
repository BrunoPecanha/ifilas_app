import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ValidateCodePageRoutingModule } from './validate-code-routing.module';

import { ValidateCodePage } from './validate-code.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ValidateCodePageRoutingModule
  ],
  declarations: [ValidateCodePage]
})
export class ValidateCodePageModule {}
