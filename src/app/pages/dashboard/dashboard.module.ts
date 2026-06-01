import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';

import { DashboardPage } from './dashboard.page';
import { NavigationBarComponent } from 'src/app/components/navigation-bar/navigation-bar.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    DashboardPageRoutingModule,
  ],
  declarations: [DashboardPage],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardPageModule {}
