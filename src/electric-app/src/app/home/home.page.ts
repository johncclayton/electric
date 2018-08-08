import {Component, NgZone} from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {Observable, Subject, timer} from 'rxjs';
import {Channel} from '../models/channel';
import {MenuController, Platform} from '@ionic/angular';
import {iChargerService} from '../services/icharger.service';
import {UIActions} from '../models/state/actions/ui';
import {ConfigurationActions} from '../models/state/actions/configuration';
import {SystemActions} from '../models/state/actions/system';
import {IAppState} from '../models/state/configure';
import {take, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {
    @select('ui.exception') exception$: Observable<any>;
    @select() charger$: Observable<Channel>;
    @select() system$: Observable<Channel>;

    timeoutUp: boolean;
    showConfigureButton: boolean;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    ngOnDestroy() {
        console.warn(`Stopping all subscribers...`);
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    constructor(
        public readonly chargerService: iChargerService,
        private uiAction: UIActions,
        private configActions: ConfigurationActions,
        private platform: Platform,
        private zone: NgZone,
        private menuController: MenuController,
        public readonly ngRedux: NgRedux<IAppState>,
        private systemActions: SystemActions,
    ) {

        let timeout = 2000;
        this.timeoutUp = false;
        this.showConfigureButton = false;

        timer(timeout)
            .pipe(
                takeUntil(this.ngUnsubscribe),
                take(1)
            )
            .subscribe(r => {
                this.timeoutUp = true;
                this.showConfigureButton = true;
            }, null, () => {
                console.debug(`'timeout and its time to show some stuff' function completed.`);
            });

        // Gotta be a better way than this.
        // This takes the 2nd notification.
        // 1st I think is the store initializing.
        // 2nd is it being loaded.
        // After THAT it's OK to do stuff.
        // Pretty messy having to have empty next + error handlers
        this.zone.runOutsideAngular(() => {
            this.ngRedux.select('config')
                .pipe(
                    takeUntil(this.ngUnsubscribe),
                    take(2)
                )
                .subscribe(undefined, undefined, () => {
                    console.log('Configuration loaded. Now getting system.');
                    this._afterConfigurationLoaded();
                });
        });
    }

    _afterConfigurationLoaded() {
        // Wait until configuration is loaded before starting things.
        this.platform.ready().then(() => {
            this.systemActions.fetchSystemFromCharger(() => {
                this.configActions.resetNetworkAtrributes();
                this.loadFirstPageDoingDebugging();
            });
            // this.chargerService.serverReconnection.subscribe(() => {
            //     this.loadFirstPageDoingDebugging();
            // });
        });
    }

    // noinspection JSMethodCanBeStatic
    get chargerName(): string {
        return iChargerService.getChargerName();
    }

    // noinspection JSMethodCanBeStatic
    get chargerTag(): string {
        return iChargerService.getChargerTag();
    }

    anyNetworkOrConnectivityProblems() {
        return this.chargerService.anyNetworkOrConnectivityProblems();
    }

    isNetworkAvailable(): boolean {
        return this.chargerService.isNetworkAvailable();
    }

    isConnectedToServer() {
        return this.chargerService.isConnectedToServer();
    }

    isConnectedToCharger() {
        return this.chargerService.isConnectedToCharger();
    }

    loadFirstPageDoingDebugging() {
    }

    makeError() {
        this.uiAction.setErrorMessage('BOOM');
        this.uiAction.setDisconnected();
    }

    chargerText() {
        if (this.isConnectedToCharger()) {
            return 'Charger OK!';
        }
        return 'Can\'t see the charger';
    }

    serverText() {
        if (this.isConnectedToServer()) {
            return 'Server/Pi connection is good!';
        }
        return 'Can\'t see the Pi';
    }

    tips() {
        let tips = [];
        if (!this.isNetworkAvailable()) {
            tips.push('Is Wifi on? There doesn\'t seem to be a network.');
        }
        if (!this.isConnectedToServer()) {
            tips.push('Check that you have the correct host URL in your Configuration.');
            tips.push('Do you have network connectivity to the Pi?');
        }
        if (!this.isConnectedToCharger()) {
            tips.push('Is the charger on?');
            tips.push('Is the charger USB plugged into the Pi?');
        }
        return tips;
    }
}
