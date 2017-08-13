import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ConfigComponent } from './config';

@NgModule({
  declarations: [
    ConfigComponent,
  ],
  imports: [
    IonicPageModule.forChild(ConfigComponent),
  ],
  exports: [
    ConfigComponent
  ]
})
export class ConfigComponentModule {}
