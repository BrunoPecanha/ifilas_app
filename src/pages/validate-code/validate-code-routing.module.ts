import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ValidateCodePage } from './validate-code.page';

const routes: Routes = [
  {
    path: '',
    component: ValidateCodePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ValidateCodePageRoutingModule {}
