import {NgModule, ErrorHandler, APP_INITIALIZER} from "@angular/core";
import {Storage} from "@ionic/storage";
import {IonicApp, IonicModule, IonicErrorHandler} from "ionic-angular";
import {MyApp} from "./app.component";
import {HomePage} from "../pages/home/home";
import {KeysPipe, ReversePipe, DurationPipe} from "../utils/pipes";
import {iChargerService} from "../services/icharger.service";
import {Configuration} from "../services/configuration.service";
import {ConfigPage} from "../pages/config/config";
import {ChannelComponent} from "../components/channel/channel";
import {ChargerStatusComponent} from "../components/charger-status/charger-status";
import {PresetListPage} from "../pages/preset-list/preset-list";
import {PresetPage} from "../pages/preset/preset";
import {PresetChargePage} from "../pages/preset-charge/preset-charge";
import {PresetStoragePage} from "../pages/preset-storage/preset-storage";
import {PresetDischargePage} from "../pages/preset-discharge/preset-discharge";
import {PresetCyclePage} from "../pages/preset-cycle/preset-cycle";
import {DynamicDisable} from "../utils/directives";
import {ChargeOptionsPage} from "../pages/charge-options/charge-options";
import {ConnectionStateComponent} from "../components/connection-state/connection-state";
import {ChannelVoltsComponent} from "../components/channel-volts/channel-volts";
import {ChannelIRComponent} from "../components/channel-volts/channel-ir";

function configServiceFactory(config: Configuration) {
    return () => config.loadConfiguration();
}

@NgModule({
    declarations: [
        MyApp,
        ConfigPage,
        HomePage,
        KeysPipe, ReversePipe, DurationPipe,
        DynamicDisable,
        ChannelComponent,
        ChannelVoltsComponent,
        ChannelIRComponent,
        ConnectionStateComponent,
        PresetListPage,
        PresetPage,
        PresetChargePage,
        PresetStoragePage,
        PresetDischargePage,
        PresetCyclePage,
        ChargeOptionsPage,
        ChargerStatusComponent
    ],
    imports: [
        IonicModule.forRoot(MyApp)
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        HomePage,
        ConfigPage,
        PresetListPage,
        PresetPage,
        PresetChargePage,
        PresetStoragePage,
        PresetDischargePage,
        PresetCyclePage,
        ChargeOptionsPage,
        ChannelComponent,
        ChannelVoltsComponent,
        ChannelIRComponent,
        ConnectionStateComponent
    ],
    providers: [
        Configuration,
        {
            provide: APP_INITIALIZER,
            useFactory: configServiceFactory,
            deps: [Configuration],
            multi: true
        },
        Storage,
        {provide: iChargerService, useClass: iChargerService},
        {provide: ErrorHandler, useClass: IonicErrorHandler}
    ]
})
export class AppModule {
}
