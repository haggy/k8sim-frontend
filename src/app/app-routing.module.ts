import { TextBasedManagerComponent } from './text-based-manager/text-based-manager.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
  { path: 'simple-manager', data: { title: 'Simple Manager' }, component: TextBasedManagerComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
