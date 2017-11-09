import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {ConfigurationActions} from "../models/state/actions/configuration";
import {NgRedux} from "@angular-redux/store";
import {IAppState} from "../models/state/configure";
import {INetwork} from "../models/state/reducers/configuration";
import {isUndefined} from "ionic-angular/util/util";

declare const networkinterface;

@Injectable()
export class ElectricNetworkService {
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    public constructor(private configActions: ConfigurationActions,
                       private ngRedux: NgRedux<IAppState>) {

    }

    fetchCurrentIPAddress() {
        let config = this.ngRedux.getState().config;
        if (config == null) {
            return;
        }

        let network = config.network;

        try {
            // console.log("Detecting network interface...");
            networkinterface.getWiFiIPAddress((ip) => {
                if (ip != network.current_ip_address) {
                    // console.log("Detected network interface: " + ip);
                    let change = {
                        'network': {
                            'current_ip_address': ip
                        }
                    };
                    this.configActions.updateConfiguration(change);
                }
            });

        } catch (ReferenceError) {
            let change = {
                'network': {
                    'current_ip_address': "192.168.10.122"
                }
            };
            this.configActions.updateConfiguration(change);
        }
    }

    getNetwork(): INetwork {
        let config = this.ngRedux.getState().config;
        if (config == null || config.network == null) {
            return null;
        }
        return config.network;
    }

    deviceIsOnStaticNetwork() {
        let network = this.getNetwork();
        if (!network) {
            return false;
        }
        return network.current_ip_address.startsWith("192.168.10");
    }

    haveWLAN0IPAddress() {
        let network = this.getNetwork();
        if (network && network.interfaces) {
            if (network.interfaces.hasOwnProperty("wlan0")) {
                let addr = network.interfaces["wlan0"];
                // console.log("wlan0 addr: " + addr);
                return addr.length > 1;
            }
        }
        return false;
    }

    get wifiSettingsValid(): boolean {
        let network = this.getNetwork();
        if (!network) {
            return false;
        }
        if (isUndefined(network.wifi_password)) {
            return false;
        }
        if (isUndefined(network.wifi_ssid)) {
            return false;
        }
        let passLength = network.wifi_password.length;
        let ssidLength = network.wifi_ssid.length;
        return ssidLength > 0 && (passLength >= 8 && passLength <= 63);
    }
}