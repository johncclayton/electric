import {NgModule} from '@angular/core';
import {UtilsModule} from '../utils/utils.module';
import {BetterRangeComponent} from './better-range/better-range.component';
import {IonicModule} from '@ionic/angular';
import {CommonModule} from '@angular/common';
import {ChannelComponent} from './channel/channel.component';
import {ChannelVoltsComponent} from './channel-volts/channel-volts.component';
import {ChannelStatusComponent} from './channel-status/channel-status.component';
import {ChannelIRComponent} from './channel-ir/channel-ir.component';
import {ConfigComponent} from './config/config.component';
import {ConnectionStateComponent} from './connection-state/connection-state.component';
import {NetworkConfigComponent} from './network-config/network-config.component';

@NgModule({
    declarations: [
        BetterRangeComponent,
        ChannelComponent,
        ChannelVoltsComponent,
        ChannelIRComponent,
        ChannelStatusComponent,
        ConfigComponent,
        ConnectionStateComponent,
        NetworkConfigComponent
    ],
    imports: [
        CommonModule,
        IonicModule,
        UtilsModule,
    ],
    exports: [
        BetterRangeComponent,
        ChannelComponent,
        ChannelVoltsComponent,
        ChannelIRComponent,
        ChannelStatusComponent,
        ConfigComponent,
        ConnectionStateComponent,
        NetworkConfigComponent
    ]
})
export class ComponentsModule {
}
