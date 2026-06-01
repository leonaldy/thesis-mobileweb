import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import * as http from '@angular/common/http';
import { SharedModule } from './shared/shared.module';

import{CacheModule} from "ionic-cache";
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(),CacheModule.forRoot({ keyPrefix: 'ptxyz-app' }),IonicStorageModule.forRoot({driverOrder:[Drivers.LocalStorage]}),SharedModule, AppRoutingModule, http.HttpClientModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
