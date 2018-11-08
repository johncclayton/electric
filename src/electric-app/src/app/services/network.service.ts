import {Injectable} from "@angular/core";
import {ConfigurationActions} from "../models/state/actions/configuration";
import {NgRedux} from "@angular-redux/store";
import {IAppState} from "../models/state/configure";
import {INetwork} from "../models/state/reducers/configuration";
import {Subject} from 'rxjs';
import {CustomNGXLoggerService, NGXLogger, NgxLoggerLevel} from 'ngx-logger';

declare const networkinterface;

@Injectable({
    providedIn: 'root'
})
export class ElectricNetworkService {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    private logger: NGXLogger;

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    public constructor(private configActions: ConfigurationActions,
                       private loggerSvc: CustomNGXLoggerService,
                       private ngRedux: NgRedux<IAppState>) {
        this.logger = this.loggerSvc.create({level: NgxLoggerLevel.INFO});
    }

    fetchCurrentIPAddress() {
        let config = this.ngRedux.getState().config;
        if (config == null) {
            this.logger.warn(`Not fetching IP Address, no configuration`);
            return;
        }

        let network = config.network;

        try {
            // this.logger.log("Detecting network interface...");
            networkinterface.getWiFiIPAddress((ip) => {
                if (ip != network.current_ip_address) {
                    this.logger.log("Detected new network interface: " + ip);
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
                // this.logger.log("wlan0 addr: " + addr);
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
        if (network.wifi_password === undefined) {
            return false;
        }
        if (network.wifi_ssid === undefined) {
            return false;
        }
        let passLength = network.wifi_password.length;
        let ssidLength = network.wifi_ssid.length;
        return ssidLength > 0 && (passLength >= 8 && passLength <= 63);
    }

    can_do_case_fan() {
        // Introduced at build 565
        return this.ngRedux.getState().config.network.docker_last_deploy > 565;
    }

    haveSeenStatusRecently() {
        return this.ngRedux.getState().config.network.docker_last_deploy > 0;
    }

    isVerified() {
        return this.haveSeenStatusRecently() && this.haveWLAN0IPAddress();
    }

    isApplyingNetworkChange() {
        let network = this.getNetwork();
        if (!network) {
            return false;
        }
        return network.is_applying_change;
    }
}