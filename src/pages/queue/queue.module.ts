import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { QueuePageRoutingModule } from './queue-routing.module';
import { QueuePage } from './queue.page';
import { SharedModule } from 'src/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    IonicModule,
    QueuePageRoutingModule
  ],
  declarations: [QueuePage]
})
export class QueuePageModule {}
