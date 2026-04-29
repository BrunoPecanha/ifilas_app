import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/services/guards/auth.guard';


const routes: Routes = [  
  {
    path: '', redirectTo: 'splash', pathMatch: 'full' 
  },  
  { 
    path: 'splash', 
    loadChildren: () => import('../pages/splash/splash.module').then(m => m.SplashPageModule) 
  },
  {
    path: 'login', 
    loadChildren: () => import('../pages/login/login.module').then(m => m.LoginPageModule) 
  },
  {
    path: 'create-account',
    loadChildren: () => import('../pages/create-account/create-account.module').then(m => m.CreateAccountPageModule)
  },
  {
    path: 'generate-password',
    loadChildren: () => import('../pages/generate-password/generate-password.module').then(m => m.GeneratePasswordPageModule)
  },
  {
    path: 'on-boarding',
    loadChildren: () => import('../pages/on-boarding-page/on-boarding.module').then(m => m.OnBoardingPageModule)
  },
   {
    path: 'validate-code',
    loadChildren: () => import('../pages/validate-code/validate-code.module').then(m => m.ValidateCodePageModule)
  },
  {
    path: 'role-registration',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/role-registration/role-registration.module').then(m => m.RoleRegistrationPageModule)
  },
  {
    path: 'select-company',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/select-company/select-company.module').then(m => m.SelectCompanyPageModule)
  },
  {
    path: 'select-professional',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/select-professional/select-professional.module').then(m => m.SelectProfessionalPageModule)
  },  
  {
    path: 'select-services',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/select-services/select-services.module').then(m => m.SelectServicesPageModule)
  },
  {
    path: 'queue',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/queue/queue.module').then(m => m.QueuePageModule)
  },
  {
    path: 'customer-list-in-queue',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/customer-list-in-queue/customer-list-in-queue.module').then(m => m.CustomerListInQueuePageModule)
  },
  {
    path: 'company-configurations',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/company-configurations/company-configurations.module').then(m => m.CompanyConfigurationsPageModule)
  },
  {
    path: 'customer-service/:id',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/customer-service/customer-service.module').then(m => m.CustomerServicePageModule)
  },
  {
    path: 'store-details/:id',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/store-details/store-details.module').then(m => m.StoreDetailsPageModule)
  },
  {
    path: 'queue-admin',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/queue-admin/queue-admin.module').then(m => m.QueueAdminPageModule)
  },
  {
    path: 'queue-details/:id',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/queue-details/queue-details.module').then(m => m.QueueDetailsPageModule)
  },
  {
    path: 'service-registration',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/service-registration/service-registration.module').then(m => m.ServiceRegistrationPageModule)
  },
  {
    path: 'associated-professional',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/associated-professional/associated-professional.module').then(m => m.AssociatedProfessionalPageModule)
  },
  {
    path: 'choose-establishment',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/choose-establishment/choose-establishment.module').then(m => m.ChooseEstablishmentPageModule)
  },
  {
    path: 'user-configurations',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/user-configurations/user-configurations.module').then(m => m.UserConfigurationsPageModule)
  },
  {
    path: 'notification',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/notification/notification.module').then(m => m.NotificationPageModule)
  },
  {
    path: 'new-queue',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/queue-admin/new-queue/new-queue.module').then(m => m.NewQueuePageModule)
  },
  {
    path: 'queue-chat/:id',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/queue-chat/queue-chat.module').then(m => m.QueueChatPageModule)
  },
  {
    path: 'waiting-rooms-queue',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/waiting-rooms-queue/waiting-rooms-queue.module').then(m => m.WaitingRoomsQueuePageModule)
  },
  {
    path: 'client-history',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/client-history/client-history.module').then(m => m.ClientHistoryPageModule)
  },
  {
    path: 'promotions',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/promotions/promotions.module').then(m => m.PromotionsPageModule)
  },
  {
    path: 'queue-list-for-owner',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/queue-list-for-owner/queue-list-for-owner.module').then(m => m.QueueListForOwnerPageModule)
  },
  {
    path: 'order-approval',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/order-approval/order-approval.module').then(m => m.OrderApprovalPageModule)
  }, 
  {
    path: 'schedule-appointment',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/schedule-appointment/schedule-appointment.module').then(m => m.ScheduleAppointmentPageModule)
  },
  {
    path: 'schedule-config',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/schedule-config/schedule-config.module').then(m => m.ScheduleConfigPageModule)
  },
  {
    path: 'owner-schedule',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/owner-schedule/owner-schedule.module').then(m => m.OwnerSchedulePageModule)
  },
  {
    path: 'reports',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/reports/reports.module').then(m => m.ReportsPageModule)
  },
  {
    path: 'item-details',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/item-details/item-details.module').then(m => m.ItemDetailsPageModule)
  },
  {
    path: 'checkout',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/checkout/checkout.module').then(m => m.CheckoutPageModule)
  },
  {
    path: 'confirmation',
    canActivate: [AuthGuard],
    loadChildren: () => import('../pages/confirmation-page/confirmation-page.module').then(m => m.ConfirmationPagePageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }