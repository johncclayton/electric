import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PresetDischargePage } from './preset-discharge.page';

const routes: Routes = [
  {
    path: '',
    component: PresetDischargePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PresetDischargePage]
})
export class PresetDischargePageModule {}
