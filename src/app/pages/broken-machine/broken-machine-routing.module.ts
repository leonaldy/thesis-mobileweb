import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BrokenMachinePage } from './broken-machine.page';

const routes: Routes = [
  {
    path: '',
    component: BrokenMachinePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BrokenMachinePageRoutingModule {}
