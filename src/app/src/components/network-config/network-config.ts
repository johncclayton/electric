import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IConfig, INetwork, INetworkKeyNames} from "../../models/state/reducers/configuration";
import {iChargerService} from "../../services/icharger.service";
import {isUndefined} from "ionic-angular/util/util";
import * as _ from "lodash";
import {ConfigurationActions} from "../../models/state/actions/configuration";

@Component({
    selector: 'network-config',
    templateUrl: 'network-config.html',
})
export class NetworkConfigComponent {

    @Input() config?: IConfig;
    @Input() showAutoButton: boolean;

    @Output() updateConfiguration: EventEmitter<any> = new EventEmitter();
    @Output() sendWifiSettings: EventEmitter<any> = new EventEmitter();

    private lastUsedDiscoveryIndex = 0;

    constructor(public chargerService: iChargerService) {
    }

    autoDetect() {
        if (this.config) {
            let network = this.config.network;
            if (network.discoveredServers != null) {
                // console.log("Have: ", this.config.discoveredServers.join(","));
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

    // wifiConnectionStatusString(): string {
    //     if (this.config.homeLanConnecting) {
    //         return "Connecting...";
    //     }
    //     if (this.config.homeLanConnected) {
    //         return "Connected: " + this.config.homeLanIPAddress;
    //
    //     }
    //     return "Not connected";
    // }

    change(keyName, value) {
        let change = [];
        change[keyName] = value;
        this.updateConfiguration.emit(change);
    }

    change_network(keyName, value) {
        let change = [];
        change[keyName] = value;
        this.updateConfiguration.emit(change);
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
        let network = this.config.network;
        if (network) {
            let state = _.pick(network, ['ap_name', 'ap_channel', 'wifi_ssid', 'docker_last_deploy']);
            if(network.interfaces) {
                if (network.interfaces.hasOwnProperty("wlan0")) {
                    state["Wifi IP"] = network.interfaces["wlan0"];
                }
            }
            if(network.services) {
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
