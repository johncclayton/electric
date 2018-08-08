import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IConfig, INetworkKeyNames} from '../../models/state/reducers/configuration';
import {iChargerService} from '../../services/icharger.service';
import {ConfigurationActions} from '../../models/state/actions/configuration';
import * as _ from "lodash";

@Component({
    selector: 'app-network-config',
    templateUrl: './network-config.component.html',
    styleUrls: ['./network-config.component.scss']
})
export class NetworkConfigComponent implements OnInit {
    @Input() config?: IConfig;
    @Input() showAutoButton: boolean;
    @Input() current_ip_address: string;

    @Output() networkWizard: EventEmitter<any> = new EventEmitter();
    @Output() updateConfiguration: EventEmitter<any> = new EventEmitter();

    private lastUsedDiscoveryIndex = 0;

    constructor(public chargerService: iChargerService,
                public configActions: ConfigurationActions) {
    }

    ngOnInit() {
    }

    autoDetect() {
        if (this.config) {
            let discoveredServers = this.config.network.discoveredServers;
            if (discoveredServers != null) {
                // console.log("Have: ", discoveredServers.join(","));
                if (discoveredServers.length > 0) {
                    if (this.lastUsedDiscoveryIndex > discoveredServers.length - 1) {
                        this.lastUsedDiscoveryIndex = 0;
                    }
                    this.config.ipAddress = discoveredServers[this.lastUsedDiscoveryIndex];
                    this.lastUsedDiscoveryIndex++;
                }
            }
        }
    }

    change(keyName, value) {
        let change = [];
        change[keyName] = value;
        this.updateConfiguration.emit(change);
    }

    // noinspection JSMethodCanBeStatic
    num(value) {
        if (value == '') {
            return 0;
        }
        return parseInt(value);
    }

    wifiStateFor(heading: string, key: string) {
        return this.sectionState(heading)[key];
    }

    // noinspection JSMethodCanBeStatic
    wifiStateKeyFor(heading: string, key: string) {
        if (INetworkKeyNames.hasOwnProperty(key)) {
            return INetworkKeyNames[key];
        }
        return key;
    }

    sectionNames() {
        return Object.keys(this.wifiState());
    }

    sectionName(key: string) {
        return this.wifiState()[key].name;
    }

    sectionState(key: string) {
        return this.wifiState()[key].items;
    }

    wifiState() {
        let sections = {
            'wifi': {name: 'Wifi Association', items: {}},
            'network': {name: 'Network / IPs', items: {}},
            'server': {name: 'Server Status', items: {}}
        };

        let network = this.config.network;
        if (network) {
            sections['wifi'].items = _.pick(network, ['ap_name', 'ap_channel', 'wifi_ssid']);

            if (network.interfaces) {
                if (network.interfaces.hasOwnProperty('wlan0')) {
                    let wlan0interface = network.interfaces['wlan0'];
                    if (wlan0interface) {
                        sections['network'].items['Home Wifi IP'] = wlan0interface;
                        this.configActions.addDiscoveredServer(wlan0interface);
                    }
                }
                if (network.interfaces.hasOwnProperty('wlan1')) {
                    sections['network'].items['Static IP'] = network.interfaces['wlan1'];
                }
            }
            if (network.discoveredServers != null) {
                let i = 1;
                for (let srv in network.discoveredServers) {
                    sections['server'].items['Discovery #' + i] = network.discoveredServers[srv];
                    i++;
                }
            }
            if (network.services) {
                sections['server'].items['Server Version'] = network['docker_last_deploy'];
                sections['server'].items['DNS Masq'] = network.services['dnsmasq'];
                sections['server'].items['Hostapd'] = network.services['hostapd'];
                sections['server'].items['Docker'] = network.services['docker'];
                sections['server'].items['Electric PI'] = network.services['electric-pi.service'];
            }
            return sections;
        }
        return {'Fetching': '...'};
    }


}
