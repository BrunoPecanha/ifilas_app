import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ScheduleAppointmentPage } from './schedule-appointment.page';
import { RouterModule, Routes } from '@angular/router';
import { TimeSlotsModalComponent } from 'src/shared/components/time-slots-modal/time-slots-modal.component';
import { SharedModule } from 'src/shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: ScheduleAppointmentPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ScheduleAppointmentPage, TimeSlotsModalComponent]
})
export class ScheduleAppointmentPageModule { }