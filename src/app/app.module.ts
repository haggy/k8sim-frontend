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
import {MatToolbarModule, MatTabsModule, MatInputModule} from '@angular/material';
import {MatListModule} from '@angular/material';
import { MatSliderModule } from '@angular/material';
import {MatSidenavModule, MatButtonModule, MatFormFieldModule} from '@angular/material';

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
    MatSliderModule,
    MatSidenavModule,
    MatButtonModule,
    MatFormFieldModule,
    MatTabsModule,
    MatInputModule,
    HttpClientModule
  ],
  providers: [
    SimulationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
