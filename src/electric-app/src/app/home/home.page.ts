import {ChangeDetectionStrategy, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {Observable, Subject, TimeoutError, timer} from 'rxjs';
import {Channel} from '../models/channel';
import {NavController, Platform} from '@ionic/angular';
import {iChargerService} from '../services/icharger.service';
import {UIActions} from '../models/state/actions/ui';
import {IAppState} from '../models/state/configure';
import {take, takeUntil} from 'rxjs/operators';
import {ConfigStoreService} from '../services/config-store.service';
import {Preset, RegenerativeMode} from '../models/preset-class';
import {iChargerPickLists} from '../utils/picklists';
import {ToastHelper} from '../utils/messaging';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage implements OnInit, OnDestroy {
    @select('ui.exception') exception$: Observable<any>;
    @select() charger$: Observable<Channel>;
    @select() system$: Observable<Channel>;
    @select() config$: Observable<Channel>;

    timeoutUp: boolean;
    showConfigureButton: boolean;

    // for random testing (no other use)
    regeneration_mode: RegenerativeMode = 0;
    some_number: number = 5;
    preset: Preset;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        public readonly chargerService: iChargerService,
        private uiAction: UIActions,
        public configService: ConfigStoreService,
        private platform: Platform,
        public chargerLists: iChargerPickLists,
        private zone: NgZone,
        private navCtrl: NavController,
        public messaging: ToastHelper,
        public readonly ngRedux: NgRedux<IAppState>,
    ) {
        this.timeoutUp = false;
        this.showConfigureButton = false;
    }


    ngOnInit() {
        let timeout = 2000;
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

        const loadAPreset = false;
        if (loadAPreset) {
            this.preset = new Preset({});
            this.chargerService.getPresets(5)
                .subscribe(presetsList => {
                    if (presetsList.length > 10) {
                        // console.warn('Got test preset: #9');
                        this.preset = presetsList[9];
                    }
                });
        }

        this.configService.configurationLoaded$.subscribe(r => {
            // this.uiAction.setErrorMessageFromString("Huzzah");
            // this.showNetworkConfigPage();
            // this.showiChargerSettingsPage();
            // this.toggleError();
            // this.showPresetList();
        });
    }

    ngOnDestroy() {
        // console.warn(`Stopping all home page subscribers...`);
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
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

    /*
    Everything below for quicker testing. Copies of methods from other pages
     */

    private showPresetList() {
        this.navCtrl.navigateForward('PresetList');
    }

    private showiChargerSettingsPage() {
        this.navCtrl.navigateForward('SystemSettings');
    }

    private showNetworkConfigPage() {
        this.navCtrl.navigateForward('NetworkConfig');
    }


    makeError() {
        this.chargerService.stopAllPolling();
        this.uiAction.setErrorMessageFromString('BOOM');
        this.uiAction.setDisconnected();
    }

    toggleError() {
        // for this test, ignore charger
        this.chargerService.stopAllPolling();

        const ui = this.ngRedux.getState().ui;
        if (ui.exception || ui.disconnectionErrorCount > 0) {
            this.uiAction.clearError();
            this.uiAction.serverReconnected();
        } else {

            // rxjs TimeoutError
            if (0) {
                let te = new TimeoutError();
                this.uiAction.setErrorFromErrorObject('BAM', te);
            }

            // Normal string message
            if (0) {
                this.uiAction.setErrorMessageFromString(`Well, FAIL`);
            }

            // Disconnection
            if (0) {
                this.uiAction.setDisconnected();
                this.uiAction.setDisconnected();
                this.uiAction.setDisconnected();
            }

            // thrown error
            if (1) {
                try {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new TimeoutError();
                } catch (e) {
                    this.uiAction.setErrorFromErrorObject(`Kaboom, cant do it`, e);
                }
            }
        }
    }

    get regenVoltLimitMinMax() {
        return this.preset.dischargeVoltageMinMax();
    }

    /*
    This was used to examine the
        @ViewChild('ngm') ngm;
    to see what the ngModel contained.
     */
    // errorsFor() {
    //     if (this.ngm) {
    //         if('errors' in this.ngm) {
    //             let theErrors = this.ngm['errors'];
    //             console.log(`Errors has: ${SWBSafeJSON.stringify(theErrors)}`);
    //             if('message' in theErrors) {
    //                 return theErrors['message'];
    //             }
    //         }
    //     }
    //     return null;
    // }

}
