import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RepairPage } from './repair.page';

const routes: Routes = [
  {
    path: '',
    component: RepairPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RepairPageRoutingModule {}
