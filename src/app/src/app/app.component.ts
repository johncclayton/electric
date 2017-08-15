import {Component, ViewChild} from "@angular/core";
import {Nav, Platform} from "ionic-angular";
import {ConfigPage} from "../pages/config/config-page";
import {iChargerService} from "../services/icharger.service";
import {PresetListPage} from "../pages/preset-list/preset-list";
import {HomePage} from "../pages/home/home";

import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {ConfigStoreProvider} from "../providers/config-store/config-store";
import {ConfigurationActions} from "../models/state/actions/configuration";
import {NgRedux} from "@angular-redux/store";
import {IAppState} from "../models/state/configure";

@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) nav: Nav;
    rootPage = HomePage;

    // rootPage = PresetListPage;
    pages: Array<{ title: string, component: any, visible: any }>;

    constructor(platform: Platform,
                public chargerService: iChargerService,
                public statusBar: StatusBar,
                public config: ConfigStoreProvider,
                public configActions: ConfigurationActions,
                public ngRedux: NgRedux<IAppState>,
                public splashScreen: SplashScreen) {


        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            statusBar.styleDefault();
            splashScreen.hide();

            this.config.loadConfiguration().subscribe(r => {
                console.log("Configuration loaded, putting into the store...");
                this.ngRedux.dispatch({
                    type: ConfigurationActions.SET_FULL_CONFIG,
                    payload: r
                });

                this.configActions.updateStateFromChargerAsync();
            });

        });

        this.pages = [
            {
                title: 'Presets', component: PresetListPage, visible: () => {
                return this.chargerService.isConnectedToCharger()
            },
            },
            {
                title: 'Config', component: ConfigPage, visible: () => {
                return true;
            }
            },
        ]
    }

    openPage(page) {
        // Reset the content nav to have just this page
        // we wouldn't want the back button to show in this scenario
        this.nav.push(page.component);
    }
}
