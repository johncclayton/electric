import {NgModule} from '@angular/core';
import {SystemComponent} from './system/system';
import {ConfigComponent} from "./config/config";
import {IonicPageModule} from "ionic-angular";
import {TempRangeComponent} from './temp-range/temp-range';

@NgModule({
    declarations: [
        SystemComponent,
        ConfigComponent,
        TempRangeComponent
    ],
    imports: [
        IonicPageModule.forChild(ConfigComponent),
    ],
    exports: [
        SystemComponent,
        ConfigComponent,
        TempRangeComponent
    ]
})
export class ComponentsModule {
}
