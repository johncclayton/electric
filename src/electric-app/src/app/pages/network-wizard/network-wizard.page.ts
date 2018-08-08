import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {IConfig} from '../../models/state/reducers/configuration';
import {Observable, Subject} from 'rxjs';
import {IAppState} from '../../models/state/configure';
import {ElectricNetworkService} from '../../services/network.service';
import {iChargerService} from '../../services/icharger.service';
import {ConfigurationActions} from '../../models/state/actions/configuration';
import {takeUntil} from 'rxjs/operators';

@Component({
    selector: 'network-wizard-page',
    templateUrl: './network-wizard.page.html',
    styleUrls: ['./network-wizard.page.scss'],
})
export class NetworkWizardPage implements OnInit, OnDestroy {
    @select() config$: Observable<IConfig>;
    @select(['config', 'network']) network$: Observable<IConfig>;
    @select(['config', 'network', 'current_ip_address']) current_ip_address$: Observable<IConfig>;

    state: {};
    tip: { header: string, content: string };
    currentState: number;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public ngRedux: NgRedux<IAppState>,
                private networkService: ElectricNetworkService,
                private chargerService: iChargerService,
                public actions: ConfigurationActions
    ) {
        this.resetState();
    }

    ngOnInit() {
        this.currentState = 0;
        this.moveToNextState();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /*
    * If we're not up to a state, it's unknown
    * For the current state, it's either red or green
     */
    stateFor(step: number) {
        if (step == 0) {
            this.moveToNextState();
        }
        if (this.state.hasOwnProperty(step)) {
            return this.state[step];
        }
        return 'unknown';
    }

    private moveToNextState() {
        this.resetState();
        this.workOutCurrentStateNumber();
    }

    private resetState() {
        this.state = {
            0: 'unknown',
            1: 'unknown',
            2: 'unknown',
        };
        this.tip = {
            header: '',
            content: ''
        };
    }

    private workOutCurrentStateNumber() {
        // Have state at all?
        let config = this.ngRedux.getState().config;
        if (config == null || config.network == null) {
            this.currentState = 0;
            return;
        }

        // Are we on the network?
        if (!this.onStaticNetwork()) {
            this.currentState = 0;
            this.state[0] = 'bad';

            this.setTip('Go to your WiFi settings and join the Electric network. The default password is \'electric\'.');

            return;
        }

        this.state[0] = 'good';
        this.currentState = 1;

        if (!this.connectedToWifi()) {
            this.state[1] = 'bad';
            this.setTip('Enter your home WiFi SSID and password, and press the Apply button');
            return;
        }
        this.setTip('You can change Wifi settings here...');
        this.state[1] = 'good';

        this.currentState = 2;
        this.state[2] = 'bad';
        if (this.networkService.isVerified()) {
            this.state[2] = 'good';
        }
    }

    nextStepIsEnabled(): boolean {
        return this.networkService.haveSeenStatusRecently();
    }

    private setTip(tip: string) {
        this.tip = {
            header: 'Next step',
            content: tip
        };
    }

    updateWifi() {
        let config = this.ngRedux.getState().config;
        if (!config) {
            return;
        }
        let network = config.network;

        if (network == null) {
            console.error('What? No network state!');
            return;
        }

        console.log('Sending WiFi settings...');
        this.actions.startWifiChange();
        this.chargerService.updateWifi(network.wifi_ssid, network.wifi_password)
            .pipe(
                takeUntil(this.ngUnsubscribe)
            ).subscribe(() => {
                console.log('We\'re done with Wifi change');
            }, null,
            () => {
                this.actions.endWifiChange();
            });
    }

    private onStaticNetwork() {
        return this.networkService.deviceIsOnStaticNetwork();
    }

    private connectedToWifi() {
        // If we have a wlan1 interface, we're connected
        return this.networkService.haveWLAN0IPAddress();
    }

}
