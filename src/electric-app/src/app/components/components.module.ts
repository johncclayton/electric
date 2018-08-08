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

@NgModule({
    declarations: [
        BetterRangeComponent,
        ChannelComponent,
        ChannelVoltsComponent,
        ChannelIRComponent,
        ChannelStatusComponent,
        ConfigComponent
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
        ConfigComponent
    ]
})
export class ComponentsModule {
}
