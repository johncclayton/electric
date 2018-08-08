import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {INetwork} from '../../models/state/reducers/configuration';
import {ElectricNetworkService} from '../../services/network.service';

@Component({
    selector: 'wifi-settings',
    templateUrl: './wifi-settings.component.html',
    styleUrls: ['./wifi-settings.component.scss']
})
export class WifiSettingsComponent implements OnInit {
    @Input() network: INetwork;
    @Input() showHeader: boolean = false;
    @Input() disabled: boolean = false;

    @Output() updateConfiguration: EventEmitter<any> = new EventEmitter();
    @Output() sendWifiSettings: EventEmitter<any> = new EventEmitter();

    constructor(public networkService: ElectricNetworkService) {
    }

    ngOnInit() {
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
}
