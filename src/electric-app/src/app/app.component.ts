import {Component, NgZone} from '@angular/core';

import {Platform} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {ConfigurationActions} from './models/state/actions/configuration';
import {iChargerService} from './services/icharger.service';
import {NgRedux} from '@angular-redux/store';
import {IAppState} from './models/state/configure';
import {Subject} from 'rxjs';
import {System} from './models/system';
import {ConfigStoreService} from './services/config-store.service';
import {SystemActions} from './models/state/actions/system';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html'
})
export class AppComponent {
    pages: Array<{ title: string, url: string, visible: any }>;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private platform: Platform,
        private splashScreen: SplashScreen,
        private statusBar: StatusBar,
        private zone: NgZone,
        private systemActions: SystemActions,
        private configActions: ConfigurationActions,
        private chargerService: iChargerService,
        private config: ConfigStoreService,
        private ngRedux: NgRedux<IAppState>,
    ) {
        this.initializeApp();
    }

    initializeApp() {
        this.platform.ready().then(() => {
            this.statusBar.styleDefault();
            this.splashScreen.hide();

            this.config.configurationLoaded
                .subscribe(r => {
                    console.log('Configuration loaded...');
                    if (r != null) {
                        if (r.network) {
                            console.log('Clearing network transient state...');
                            r.network.discoveredServers = [];
                            r.network.interfaces = [];
                            r.network.services = [];
                        }
                        console.debug(`Putting config ${JSON.stringify(r)} into redux store`);
                        this.ngRedux.dispatch({
                            type: ConfigurationActions.SET_FULL_CONFIG,
                            payload: r
                        });
                        console.log('Pushed config into redux store.');
                    } else {
                        console.error(`Config is null? wtf?`);
                    }
                }, null, () => {
                    console.log(`Configuration loading completed`);
                    this._afterConfigurationLoaded();
                });
            this.config.loadConfiguration();

            let connectedToCharger = () => {
                return this.chargerService.isConnectedToCharger();
            };

            this.pages = [
                {
                    title: 'Presets', url: 'PresetList', visible: connectedToCharger,
                },
                {
                    title: 'iCharger Settings', url: 'SystemSettings', visible: connectedToCharger
                },
                {
                    title: 'App Settings', url: 'Config', visible: () => {
                        return true;
                    }
                },
                {
                    title: 'Network Settings', url: 'NetworkConfig', visible: () => {
                        return true;
                    }
                },
            ];
        });
    }

    _afterConfigurationLoaded() {
        // Wait until configuration is loaded before starting things.
        this.systemActions.fetchSystemFromCharger(() => {
            this.configActions.resetNetworkAtrributes();
        });
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
}
