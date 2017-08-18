import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {SystemSettingsPage} from './system-settings';
import {SystemComponent} from "../../components/system/system";
import {CommonModule} from "@angular/common";
import {ComponentsModule} from "../../components/components.module";

@NgModule({
    declarations: [
        SystemSettingsPage,
    ],
    entryComponents: [
    ],
    imports: [
        CommonModule,
        ComponentsModule,
        IonicPageModule.forChild(SystemSettingsPage),
    ]
})
export class SystemSettingsPageModule {
}
