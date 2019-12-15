import { HttpClientModule, HttpClient, HttpHandler } from '@angular/common/http';
import { SimulationService as SimulationService } from './simulation.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TextBasedManagerComponent } from './text-based-manager/text-based-manager.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MatGridListModule } from '@angular/material/grid-list';
import {MatCardModule} from '@angular/material/card';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatListModule} from '@angular/material/list';

@NgModule({
  declarations: [
    AppComponent,
    TextBasedManagerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NoopAnimationsModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatToolbarModule,
    MatListModule,
    HttpClientModule
  ],
  providers: [
    SimulationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
