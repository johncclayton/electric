import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IConfig} from "../../models/state/reducers/configuration";
import {iChargerService} from "../../services/icharger.service";
import {System} from "../../models/system";
import {isUndefined} from "ionic-angular/util/util";

@Component({
    selector: 'network-config',
    templateUrl: 'network-config.html'
})
export class NetworkConfigComponent {

    @Input() config?: IConfig;
    @Input() showAutoButton: boolean;

    @Output() updateConfiguration: EventEmitter<any> = new EventEmitter();
    @Output() sendWifiSettings: EventEmitter<any> = new EventEmitter();

    private lastUsedDiscoveryIndex = 0;

    constructor(public chargerService: iChargerService) {
        this.chargerService.detectWifiConnectionStatus();
    }

    autoDetect() {
        if (this.config.discoveredServers != null) {
            // console.log("Have: ", this.config.discoveredServers.join(","));
            if (this.config.discoveredServers.length > 0) {
                if (this.lastUsedDiscoveryIndex > this.config.discoveredServers.length - 1) {
                    this.lastUsedDiscoveryIndex = 0;
                }
                this.config.ipAddress = this.config.discoveredServers[this.lastUsedDiscoveryIndex];
                this.lastUsedDiscoveryIndex++;
            }
        }
    }

    wifiConnectionStatusString(): string {
        if (this.config.homeLanConnecting) {
            return "Connecting...";
        }
        if (this.config.homeLanConnected) {
            return "Connected: " + this.config.homeLanIPAddress;

        }
        return "Not connected";
    }

    change(keyName, value) {
        let change = [];
        change[keyName] = value;
        this.updateConfiguration.emit(change);
    }

    get wifiSettingsValid(): boolean {
        if (isUndefined(this.config.homeLanPassword)) {
            return false;
        }
        if (isUndefined(this.config.homeLanSSID)) {
            return false;
        }

        let passLength = this.config.homeLanPassword.length;
        let ssidLength = this.config.homeLanSSID.length;
        // console.log("SSID Len:", ssidLength, "P Len:", passLength);
        return ssidLength > 0 && (passLength >= 8 && passLength <= 63);
    }

}
