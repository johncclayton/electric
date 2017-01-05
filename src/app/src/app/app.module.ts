import {NgModule, ErrorHandler} from "@angular/core";
import {Storage} from '@ionic/storage';
import {IonicApp, IonicModule, IonicErrorHandler} from "ionic-angular";
import {MyApp} from "./app.component";
import {HomePage} from "../pages/home/home";
import {TabsPage} from "../pages/tabs/tabs";
import {KeysPipe} from "../utils/pipes";
import {iChargerService} from "../services/icharger.service";
import {Configuration} from "../services/configuration.service";
import {ConfigPage} from "../pages/config/config";
import {FormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    MyApp,
    ConfigPage,
    HomePage,
    TabsPage,
    KeysPipe
  ],
  imports: [
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    ConfigPage,
    TabsPage
  ],
  providers: [iChargerService, Configuration, Storage, {provide: ErrorHandler, useClass: IonicErrorHandler}]
})
export class AppModule {
}
