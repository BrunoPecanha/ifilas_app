import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ScheduleConfigPageRoutingModule } from './schedule-config-routing.module';

import { ScheduleConfigPage } from './schedule-config.page';
import { SharedModule } from 'src/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    ScheduleConfigPageRoutingModule
  ],
  declarations: [ScheduleConfigPage]
})
export class ScheduleConfigPageModule { }
