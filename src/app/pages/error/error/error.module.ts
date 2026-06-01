import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ErrorPageRoutingModule } from './error-routing.module';

import { ErrorPage } from './error.page';
import { NotfoundMessageComponent } from 'src/app/components/errors/notfound-message/notfound-message.component';
import { ServererrorMessageComponent } from 'src/app/components/errors/servererror-message/servererror-message.component';
import { ForbiddenMessageComponent } from 'src/app/components/errors/forbidden-message/forbidden-message.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ErrorPageRoutingModule
  ],
  declarations: [ErrorPage,
    NotfoundMessageComponent,
    ServererrorMessageComponent,
    ForbiddenMessageComponent
  ],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class ErrorPageModule {}
