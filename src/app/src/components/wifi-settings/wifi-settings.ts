import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IConfig, INetwork} from "../../models/state/reducers/configuration";
import {ElectricNetworkService} from "../../services/network.service";

@Component({
    selector: 'wifi-settings',
    templateUrl: 'wifi-settings.html'
})
export class WifiSettingsComponent {

    @Input() network: INetwork;
    @Input() showHeader: boolean = false;

    @Output() updateConfiguration: EventEmitter<any> = new EventEmitter();
    @Output() sendWifiSettings: EventEmitter<any> = new EventEmitter();

    constructor(public networkService: ElectricNetworkService) {
    }

    change(keyName, value) {
        let change = [];
        change[keyName] = value;
        this.updateConfiguration.emit(change);
    }

    num(value) {
        if (value == "") {
            return 0;
        }
        return parseInt(value);
    }

}
