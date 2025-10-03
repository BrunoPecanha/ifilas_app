import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OwnerSchedulePage } from './owner-schedule.page';

const routes: Routes = [
  {
    path: '',
    component: OwnerSchedulePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OwnerSchedulePageRoutingModule {}
