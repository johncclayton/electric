import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SystemSettingsPage } from './system-settings';

@NgModule({
  declarations: [
    SystemSettingsPage,
  ],
  imports: [
    IonicPageModule.forChild(SystemSettingsPage),
  ],
})
export class SystemSettingsPageModule {}
