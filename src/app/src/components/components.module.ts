import {NgModule} from '@angular/core';
import {SystemComponent} from './system/system';
import {ConfigComponent} from "./config/config";
import {IonicPageModule} from "ionic-angular";
import {TempRangeComponent} from './temp-range/temp-range';
import {BetterRangeComponent} from './better-range/better-range';
import {NetworkConfigComponent} from './network-config/network-config';

@NgModule({
    declarations: [
        SystemComponent,
        ConfigComponent,
        TempRangeComponent,
        BetterRangeComponent,
        NetworkConfigComponent,
    ],
    imports: [
        IonicPageModule.forChild(ConfigComponent),
    ],
    exports: [
        SystemComponent,
        ConfigComponent,
        TempRangeComponent,
        BetterRangeComponent,
        NetworkConfigComponent,
    ]
})
export class ComponentsModule {
}
