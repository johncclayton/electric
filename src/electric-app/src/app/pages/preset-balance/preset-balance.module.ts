import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PresetBalancePage } from './preset-balance.page';

const routes: Routes = [
  {
    path: '',
    component: PresetBalancePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PresetBalancePage]
})
export class PresetBalancePageModule {}
