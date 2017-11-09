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
import {NetworkPage} from "../pages/network-page/network-page";
import {System} from "../models/system";

@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) nav: Nav;
    rootPage = HomePage;

    // rootPage = PresetListPage;
    pages: Array<{ title: string, component: any, visible: any }>;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public chargerService: iChargerService,
                public statusBar: StatusBar,
                public config: ConfigStoreProvider,
                public platform: Platform,
                public ngRedux: NgRedux<IAppState>,
                public splashScreen: SplashScreen) {


        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            statusBar.styleDefault();

            // Style is currently borked with a status bar that is being shown.
            // statusBar.show();
            statusBar.hide();
            splashScreen.hide();

            this.config.loadConfiguration()
                .takeUntil(this.ngUnsubscribe)
                .subscribe(r => {
                    console.log("Configuration loaded, putting into the store...");
                    if (r != null) {
                        if (r.network) {
                            console.log("Clearing network transient state...");
                            r.network.discoveredServers = [];
                            r.network.interfaces = [];
                            r.network.services = [];
                        }
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
            title: 'App Settings', component: ConfigPage, visible: () => {
                return true;
            }
        };
        let networkPage = {
            title: 'Network Settings', component: NetworkPage, visible: () => {
                return true
            }
        };
        let systemPage = {
            title: 'iCharger Settings', component: SystemSettingsPage, visible: connectedToCharger
        };
        this.pages = [
            presetsPage,
            systemPage,
            configPage,
            networkPage,
        ]
    }

    get isProduction(): boolean {
        return System.isProduction;
    }

    platformsString(): string {
        return this.platform.platforms().toString();
    }

    environmentKeys(): any {
        return Object.keys(System.environment);
    }

    environmentValue(key: string) {
        return System.environment[key];
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
