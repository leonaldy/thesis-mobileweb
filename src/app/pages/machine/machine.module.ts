import { SharedModule } from 'src/app/shared/shared.module';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MachinePageRoutingModule } from './machine-routing.module';

import { MachinePage } from './machine.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    MachinePageRoutingModule
  ],
  declarations: [MachinePage],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class MachinePageModule {}
