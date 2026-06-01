import { MachineFormComponent } from './../../../components/forms/machine-form/machine-form.component';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddUpdatePageRoutingModule } from './add-update-routing.module';

import { AddUpdatePage } from './add-update.page';
import { SharedModule } from 'src/app/shared/shared.module';
import { UserFormComponent } from 'src/app/components/forms/user-form/user-form.component';
import { ReportFormComponent } from 'src/app/components/forms/report-form/report-form.component';
import { SparepartFormComponent } from 'src/app/components/forms/sparepart-form/sparepart-form.component';
import { CategoryFormComponent } from 'src/app/components/forms/category-form/category-form.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    AddUpdatePageRoutingModule
  ],
  declarations: [
    AddUpdatePage,
    MachineFormComponent,
    UserFormComponent,
    ReportFormComponent,
    SparepartFormComponent,
    CategoryFormComponent
  ],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class AddUpdatePageModule {}
