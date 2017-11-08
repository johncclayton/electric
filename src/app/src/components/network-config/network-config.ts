import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IConfig, INetworkKeyNames} from "../../models/state/reducers/configuration";
import {iChargerService} from "../../services/icharger.service";
import {isUndefined} from "ionic-angular/util/util";
import * as _ from "lodash";
import {NetworkActions} from "../../models/state/actions/network";
import {ConfigurationActions} from "../../models/state/actions/configuration";

declare const networkinterface;

@Component({
    selector: 'network-config',
    templateUrl: 'network-config.html',
})
export class NetworkConfigComponent {

    @Input() config?: IConfig;
    @Input() showAutoButton: boolean;

    @Output() updateConfiguration: EventEmitter<any> = new EventEmitter();
    @Output() sendWifiSettings: EventEmitter<any> = new EventEmitter();

    public currentIPAddress: string = "...";
    private lastUsedDiscoveryIndex = 0;

    constructor(public chargerService: iChargerService,
                public configActions: ConfigurationActions) {
    }

    autoDetect() {
        if (this.config) {
            let network = this.config.network;
            if (network.discoveredServers != null) {
                console.log("Have: ", network.discoveredServers.join(","));
                if (network.discoveredServers.length > 0) {
                    if (this.lastUsedDiscoveryIndex > network.discoveredServers.length - 1) {
                        this.lastUsedDiscoveryIndex = 0;
                    }
                    this.config.ipAddress = network.discoveredServers[this.lastUsedDiscoveryIndex];
                    this.lastUsedDiscoveryIndex++;
                }
            }
        }
    }

    fetchCurrentIPAddress() {
        try {
            // console.log("Detecting network interface...");
            networkinterface.getWiFiIPAddress((ip) => {
                if (ip != this.currentIPAddress) {
                    console.log("Detected network interface: " + ip);
                    this.currentIPAddress = ip;
                }
            });

        } catch (ReferenceError) {
            this.currentIPAddress = "<in browser>";
        }
    }

    change(keyName, value) {
        let change = [];
        change[keyName] = value;
        this.updateConfiguration.emit(change);
    }

    num(value) {
        if(value == "") {
            return 0;
        }
        return parseInt(value);
    }

    wifiStateFor(key: string) {
        return this.wifiState()[key];
    }

    wifiStateKeyFor(key: string) {
        if (INetworkKeyNames.hasOwnProperty(key)) {
            return INetworkKeyNames[key];
        }
        return key;
    }

    wifiState() {
        this.fetchCurrentIPAddress();
        let network = this.config.network;
        if (network) {
            let state = _.pick(network, ['ap_name', 'ap_channel', 'wifi_ssid', 'docker_last_deploy']);
            if (network.interfaces) {
                if (network.interfaces.hasOwnProperty("wlan0")) {
                    state["Wifi IP"] = network.interfaces["wlan0"];
                }
            }
            if (network.services) {
                state["DNS Masq"] = network.services['dnsmasq'];
                state["Hostapd"] = network.services['hostapd'];
                state["Docker"] = network.services['docker'];
                state["Electric PI"] = network.services['electric-pi.service'];
            }
            return state;
        }
        return {"Fetching": "..."};
    }

    get wifiSettingsValid(): boolean {
        if (this.config) {
            let network = this.config.network;
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
        return false;
    }

}
