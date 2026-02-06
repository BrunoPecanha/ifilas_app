import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OwnerSchedulePage } from './owner-schedule.page';
import { SharedModule } from 'src/shared/shared.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OwnerSchedulePageRoutingModule } from './owner-schedule-routing.module';
import { CpfSearchModalComponent } from './modals/cpf-search-modal/cpf-search-modal.component';
import { CustomerTypeModalComponent } from './modals/customer-type-modal/customer-type-modal.component';
import { WalkInCustomerModalComponent } from './modals/walk-in-customer-modal/walk-in-customer-modal.component';
import { TransferCustomerModalComponent } from "./modals/transfer-modal/transfer-customer-modal.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    DragDropModule,
    IonicModule,
    OwnerSchedulePageRoutingModule
  ],
  declarations: [
    OwnerSchedulePage,
    CustomerTypeModalComponent,
    CpfSearchModalComponent,
    WalkInCustomerModalComponent,
    TransferCustomerModalComponent
  ]
})
export class OwnerSchedulePageModule { }
