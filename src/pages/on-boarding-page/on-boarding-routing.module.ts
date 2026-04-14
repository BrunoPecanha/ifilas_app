import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OnboardingPage } from './on-boarding.page';


const routes: Routes = [
  {
    path: '',
    component: OnboardingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OnBoardingPageRoutingModule {}
