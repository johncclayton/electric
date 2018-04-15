import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {NgRedux, select} from "@angular-redux/store";
import {IAppState} from "../../models/state/configure";
import {IConfig} from "../../models/state/reducers/configuration";
import {Observable} from "rxjs/Observable";
import {ElectricNetworkService} from "../../services/network.service";
import {iChargerService} from "../../services/icharger.service";
import {ConfigurationActions} from "../../models/state/actions/configuration";
import {Subject} from "rxjs/Subject";


@Component({
    selector: 'page-network-wiz-home',
    templateUrl: 'network-wiz-home.html',
})
export class NetworkWizHomePage {

    @select() config$: Observable<IConfig>;
    @select(['config', 'network']) network$: Observable<IConfig>;
    @select(['config', 'network', 'current_ip_address']) current_ip_address$: Observable<IConfig>;

    private state: {};
    private tip: {};
    private currentState: number;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public navCtrl: NavController,
                public ngRedux: NgRedux<IAppState>,
                private networkService: ElectricNetworkService,
                private chargerService: iChargerService,
                private actions: ConfigurationActions,
                public navParams: NavParams) {
        this.resetState();
    }

    ionViewDidLoad() {
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
            header: "",
            content: ""
        }
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

            this.setTip("Go to your WiFi settings and join the Electric network. The default password is 'electric'.");

            return;
        }

        this.state[0] = 'good';
        this.currentState = 1;

        if (!this.connectedToWifi()) {
            this.state[1] = 'bad';
            this.setTip("Enter your home WiFi SSID and password, and press the Apply button");
            return;
        }
        this.setTip("You can change Wifi settings here...");
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
            'header': 'Next step',
            'content': tip
        }
    }

    updateWifi() {
        let config = this.ngRedux.getState().config;
        if (!config) {
            return;
        }
        let network = config.network;

        if (network == null) {
            console.error("What? No network state!");
            return;
        }

        console.log("Sending WiFi settings...");
        this.actions.startWifiChange();
        this.chargerService.updateWifi(network.wifi_ssid, network.wifi_password)
            .takeUntil(this.ngUnsubscribe)
            .subscribe(v => {
                console.log("We're done with Wifi change");
            }, (e) => {

            }, () => {
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
