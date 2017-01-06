import {NgModule, ErrorHandler} from "@angular/core";
import {Storage} from "@ionic/storage";
import {IonicApp, IonicModule, IonicErrorHandler} from "ionic-angular";
import {MyApp} from "./app.component";
import {HomePage} from "../pages/home/home";
import {TabsPage} from "../pages/tabs/tabs";
import {KeysPipe} from "../utils/pipes";
import {iChargerService} from "../services/icharger.service";
import {Configuration} from "../services/configuration.service";
import {ConfigPage} from "../pages/config/config";
import {iChargerMockService} from "../services/icharger.mock.service";
import {ChannelComponent} from "../components/channel/channel";
import {ChargerStatusComponent} from "../components/charger-status/charger-status";

@NgModule({
  declarations: [
    MyApp,
    ConfigPage,
    HomePage,
    KeysPipe,
    ChannelComponent,
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
    ChannelComponent
  ],
  providers: [
    Configuration,
    Storage,
    {provide: iChargerService, useClass: iChargerService},
    // {provide: iChargerService, useClass: iChargerMockService},
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {
}
