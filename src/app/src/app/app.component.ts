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
import {SystemSettingsPage} from "../pages/system-settings/system-settings";
import {Subject} from "rxjs/Subject";

@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) nav: Nav;
    rootPage = HomePage;

    // rootPage = PresetListPage;
    pages: Array<{ title: string, component: any, visible: any }>;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(platform: Platform,
                public chargerService: iChargerService,
                public statusBar: StatusBar,
                public config: ConfigStoreProvider,
                public ngRedux: NgRedux<IAppState>,
                public splashScreen: SplashScreen) {


        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            statusBar.styleDefault();
            splashScreen.hide();

            this.config.loadConfiguration()
                .takeUntil(this.ngUnsubscribe)
                .subscribe(r => {
                    console.log("Configuration loaded, putting into the store...");
                    if (r != null) {
                        r.discoveredServers = [];
                        this.ngRedux.dispatch({
                            type: ConfigurationActions.SET_FULL_CONFIG,
                            payload: r
                        });
                    }
                });

        });

        let connectedToCharger = () => {
            return this.chargerService.isConnectedToCharger()
        };
        let presetsPage = {
            title: 'Presets', component: PresetListPage, visible: connectedToCharger,
        };
        let configPage = {
            title: 'Config', component: ConfigPage, visible: () => {
                return true;
            }
        };
        let systemPage = {
            title: 'Settings', component: SystemSettingsPage, visible: connectedToCharger
        };
        this.pages = [
            presetsPage,
            systemPage,
            configPage,
        ]
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    openPage(page) {
        // Reset the content nav to have just this page
        // we wouldn't want the back button to show in this scenario
        this.nav.push(page.component);
    }
}
