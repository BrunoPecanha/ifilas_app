import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [  
  {
    path: '', redirectTo: 'splash', pathMatch: 'full' 
  },
  { 
    path: 'splash', 
    loadChildren: () => import('../pages/splash/splash.module').then(m => m.SplashPageModule) 
  },
  {
    path: 'login', loadChildren: () => import('../pages/login/login.module').then(m => m.LoginPageModule) 
  },
  {
    path: 'create-account',
    loadChildren: () => import('../pages/create-account/create-account.module').then( m => m.CreateAccountPageModule)/*, canActivate: [AuthGuard]*/ 
  },
  {
    path: 'generate-password',
    loadChildren: () => import('../pages/generate-password/generate-password.module').then( m => m.GeneratePasswordPageModule)
  },   {
    path: 'role-registration',
    loadChildren: () => import('../pages/role-registration/role-registration.module').then( m => m.RoleRegistrationPageModule)/*, canActivate: [AuthGuard]*/
  },
  {
    path: 'select-company',
    loadChildren: () => import('../pages/select-company/select-company.module').then( m => m.SelectCompanyPageModule)
  },
  {
    path: 'select-professional',
    loadChildren: () => import('../pages/select-professional/select-professional.module').then( m => m.SelectProfessionalPageModule)
  },  
  {
    path: 'select-services',
    loadChildren: () => import('../pages/select-services/select-services.module').then( m => m.SelectServicesPageModule)
  },   {
    path: 'queue',
    loadChildren: () => import('../pages/queue/queue.module').then( m => m.QueuePageModule)
  },
  {
    path: 'customer-list-in-queue',
    loadChildren: () => import('../pages/customer-list-in-queue/customer-list-in-queue.module').then( m => m.CustomerListInQueuePageModule)
  },
  {
    path: 'company-configurations',
    loadChildren: () => import('../pages/company-configurations/company-configurations.module').then( m => m.CompanyConfigurationsPageModule)
  },
  {
    path: 'customer-service/:id',
    loadChildren: () => import('../pages/customer-service/customer-service.module').then( m => m.CustomerServicePageModule)
  },
  {
    path: 'store-details/:id',
    loadChildren: () => import('../pages/store-details/store-details.module').then(m => m.StoreDetailsPageModule)
  },
  {
    path: 'queue-admin',
    loadChildren: () => import('../pages/queue-admin/queue-admin.module').then( m => m.QueueAdminPageModule)
  },
  {
    path: 'queue-details/:id',
    loadChildren: () => import('../pages/queue-details/queue-details.module').then( m => m.QueueDetailsPageModule)
  },
  {
    path: 'service-registration',
    loadChildren: () => import('../pages/service-registration/service-registration.module').then( m => m.ServiceRegistrationPageModule)
  },
  {
    path: 'associated-professional',
    loadChildren: () => import('../pages/associated-professional/associated-professional.module').then( m => m.AssociatedProfessionalPageModule)
  },
  {
    path: 'choose-establishment',
    loadChildren: () => import('../pages/choose-establishment/choose-establishment.module').then( m => m.ChooseEstablishmentPageModule)
  },
  {
    path: 'user-configurations',
    loadChildren: () => import('../pages/user-configurations/user-configurations.module').then( m => m.UserConfigurationsPageModule)
  },
  {
    path: 'notification',
    loadChildren: () => import('../pages/notification/notification.module').then( m => m.NotificationPageModule)
  },
  {
    path: 'new-queue',
    loadChildren: () => import('../pages/queue-admin/new-queue/new-queue.module').then( m => m.NewQueuePageModule)
  },
  {
    path: 'queue-chat/:id',
    loadChildren: () => import('../pages/queue-chat/queue-chat.module').then( m => m.QueueChatPageModule)
  },
  {
    path: 'waiting-rooms-queue',
    loadChildren: () => import('../pages/waiting-rooms-queue/waiting-rooms-queue.module').then( m => m.WaitingRoomsQueuePageModule)
  },
  {
    path: 'client-history',
    loadChildren: () => import('../pages/client-history/client-history.module').then( m => m.ClientHistoryPageModule)
  },
  {
    path: 'promotions',
    loadChildren: () => import('../pages/promotions/promotions.module').then(m => m.PromotionsPageModule)
  },
  {
    path: 'queue-list-for-owner',
    loadChildren: () => import('../pages/queue-list-for-owner/queue-list-for-owner.module').then( m => m.QueueListForOwnerPageModule)
  },
  {
    path: 'order-approval',
    loadChildren: () => import('../pages/order-approval/order-approval.module').then( m => m.OrderApprovalPageModule)
  },
  {
    path: 'validate-code',
    loadChildren: () => import('../pages/validate-code/validate-code.module').then( m => m.ValidateCodePageModule)
  },
  {
    path: 'schedule-appointment',
    loadChildren: () => import('../pages/schedule-appointment/schedule-appointment.module').then( m => m.ScheduleAppointmentPageModule)
  },
  {
    path: 'schedule-config',
    loadChildren: () => import('../pages/schedule-config/schedule-config.module').then( m => m.ScheduleConfigPageModule)
  },
  {
    path: 'owner-schedule',
    loadChildren: () => import('../pages/owner-schedule/owner-schedule.module').then( m => m.OwnerSchedulePageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
