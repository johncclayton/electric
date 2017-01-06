import {NgModule, ErrorHandler} from "@angular/core";
import {Storage} from "@ionic/storage";
import {IonicApp, IonicModule, IonicErrorHandler} from "ionic-angular";
import {MyApp} from "./app.component";
import {HomePage} from "../pages/home/home";
import {KeysPipe} from "../utils/pipes";
import {iChargerService} from "../services/icharger.service";
import {Configuration} from "../services/configuration.service";
import {ConfigPage} from "../pages/config/config";
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
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {
}
