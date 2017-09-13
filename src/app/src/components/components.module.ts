import {NgModule} from '@angular/core';
import {SystemComponent} from './system/system';
import {ConfigComponent} from "./config/config";
import {IonicPageModule} from "ionic-angular";
import {TempRangeComponent} from './temp-range/temp-range';
import {BetterRangeComponent} from './better-range/better-range';

@NgModule({
    declarations: [
        SystemComponent,
        ConfigComponent,
        TempRangeComponent,
        BetterRangeComponent,
    ],
    imports: [
        IonicPageModule.forChild(ConfigComponent),
    ],
    exports: [
        SystemComponent,
        ConfigComponent,
        TempRangeComponent,
        BetterRangeComponent,
    ]
})
export class ComponentsModule {
}
