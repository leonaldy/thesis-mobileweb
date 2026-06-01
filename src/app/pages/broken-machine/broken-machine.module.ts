import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BrokenMachinePageRoutingModule } from './broken-machine-routing.module';

import { BrokenMachinePage } from './broken-machine.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BrokenMachinePageRoutingModule
  ],
  declarations: [BrokenMachinePage]
})
export class BrokenMachinePageModule {}
