import {NgModule} from '@angular/core';
import {SystemComponent} from './system/system';
import {ConfigComponent} from "./config/config";
import {IonicPageModule} from "ionic-angular";
import {TempRangeComponent} from './temp-range/temp-range';
import {BetterRangeComponent} from './better-range/better-range';
import {NetworkConfigComponent} from './network-config/network-config';
import {UtilsModule} from "../utils/utils.module";
import {WifiSettingsComponent} from './wifi-settings/wifi-settings';

@NgModule({
    declarations: [
        SystemComponent,
        ConfigComponent,
        TempRangeComponent,
        BetterRangeComponent,
        NetworkConfigComponent,
        WifiSettingsComponent,
    ],
    imports: [
        IonicPageModule.forChild(ConfigComponent),
        UtilsModule,
    ],
    exports: [
        SystemComponent,
        ConfigComponent,
        TempRangeComponent,
        BetterRangeComponent,
        NetworkConfigComponent,
        WifiSettingsComponent,
    ]
})
export class ComponentsModule {
}
