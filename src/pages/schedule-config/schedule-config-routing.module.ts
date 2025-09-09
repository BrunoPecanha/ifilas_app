import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ScheduleConfigPage } from './schedule-config.page';

const routes: Routes = [
  {
    path: '',
    component: ScheduleConfigPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScheduleConfigPageRoutingModule {}
