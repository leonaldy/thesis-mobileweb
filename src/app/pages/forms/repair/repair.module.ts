import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RepairPageRoutingModule } from './repair-routing.module';
import { NgSelectModule } from '@ng-select/ng-select';

import { RepairPage } from './repair.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RepairPageRoutingModule,
    NgSelectModule
  ],
  declarations: [RepairPage]
})
export class RepairPageModule {}
