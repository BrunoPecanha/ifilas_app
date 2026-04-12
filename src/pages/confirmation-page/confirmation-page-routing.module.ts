import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfirmationPage } from './confirmation-page.page';

const routes: Routes = [
  {
    path: '',
    component: ConfirmationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfirmationPagePageRoutingModule {}
