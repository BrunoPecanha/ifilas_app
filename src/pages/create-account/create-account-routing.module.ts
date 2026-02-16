import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CreateAccountPage } from './create-account.page';

const routes: Routes = [
  {
    path: '',
    component: CreateAccountPage
  },  {
    path: 'terms',
    loadChildren: () => import('./legal/terms/terms.module').then( m => m.TermsPageModule)
  },
  {
    path: 'privacy',
    loadChildren: () => import('./legal/privacy/privacy.module').then( m => m.PrivacyPageModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreateAccountPageRoutingModule {}
