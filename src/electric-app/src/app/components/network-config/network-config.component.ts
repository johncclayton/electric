import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {IConfig, INetwork, INetworkKeyNames} from '../../models/state/reducers/configuration';
import {iChargerService} from '../../services/icharger.service';
import {ConfigurationActions} from '../../models/state/actions/configuration';
import * as _ from 'lodash';
import {BehaviorSubject, Subject} from 'rxjs';
import {NgRedux} from '@angular-redux/store';
import {IAppState} from '../../models/state/configure';
import {takeUntil} from 'rxjs/operators';

class Section {
    key: string;
    title: string;
    items: {};

    constructor(key: string, title: string) {
        this.key = key;
        this.title = title;
        this.items = {};
    }

    get itemsKeys(): Array<string> {
        return Object.keys(this.items);
    }

    titleForItemKey(itemKey: string): string {
        // noinspection JSMethodCanBeStatic
        if (INetworkKeyNames.hasOwnProperty(itemKey)) {
            return INetworkKeyNames[itemKey];
        }
        return itemKey;
    }
}

@Component({
    selector: 'network-config',
    templateUrl: './network-config.component.html',
    styleUrls: ['./network-config.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkConfigComponent implements OnInit, OnDestroy {
    @Input() config?: IConfig;
    @Input() showAutoButton: boolean;
    @Input() current_ip_address: string;

    @Output() networkWizard: EventEmitter<any> = new EventEmitter();
    @Output() updateConfiguration: EventEmitter<any> = new EventEmitter();

    sections$: Subject<Array<Section>>;
    private lastUsedDiscoveryIndex = 0;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public chargerService: iChargerService,
                public ngRedux: NgRedux<IAppState>,
                public configActions: ConfigurationActions) {
    }

    ngOnInit() {
        this.sections$ = new BehaviorSubject<any>([]);
        this.ngRedux.select(['config', 'network']).pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe((network: INetwork) => {
            this.parseNewSections(network);
        });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
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
        // console.warn(`Change ${keyName} to ${JSON.stringify(value)}`);
        this.updateConfiguration.emit(change);
    }

    // noinspection JSMethodCanBeStatic
    num(value) {
        if (value == '') {
            return 0;
        }
        return parseInt(value);
    }

    parseNewSections(network: INetwork) {
        let wifiSection = new Section('wifi', 'Wifi Association');
        let networkSection = new Section('network', 'Network / IPs');
        let serverSection = new Section('server', 'Server Status');
        let sections: Array<Section> = [wifiSection, networkSection, serverSection];

        // console.warn(`NETWORK: ${JSON.stringify(network)}`);
        if (network) {

            wifiSection.items = _.pick(network, ['ap_name', 'ap_channel', 'wifi_ssid']);

            if (network.interfaces) {
                if (network.interfaces.hasOwnProperty('wlan0')) {
                    let wlan0interface = network.interfaces['wlan0'];
                    if (wlan0interface) {
                        networkSection.items['Home Wifi IP'] = wlan0interface;
                        this.configActions.addDiscoveredServer(wlan0interface);
                    }
                }
                if (network.interfaces.hasOwnProperty('wlan1')) {
                    networkSection.items['Static IP'] = network.interfaces['wlan1'];
                }
            }
            if (network.discoveredServers != null) {
                let i = 1;
                for (let srv in network.discoveredServers) {
                    serverSection.items['Discovery #' + i] = network.discoveredServers[srv];
                    i++;
                }
            }
            if (network.services) {
                serverSection.items['Server Version'] = network['docker_last_deploy'];
                serverSection.items['DNS Masq'] = network.services['dnsmasq'];
                serverSection.items['Hostapd'] = network.services['hostapd'];
                serverSection.items['Docker'] = network.services['docker'];
                serverSection.items['Electric PI'] = network.services['electric-pi.service'];
            }
        }

        this.sections$.next(sections);
    }


}
