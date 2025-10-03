import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OwnerSchedulePage } from './owner-schedule.page';
import { SharedModule } from 'src/shared/shared.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OwnerSchedulePageRoutingModule } from './owner-schedule-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    DragDropModule,
    IonicModule,
    OwnerSchedulePageRoutingModule
  ],
  declarations: [OwnerSchedulePage]
})
export class OwnerSchedulePageModule { }
