import {Component, Input} from '@angular/core';
import {iChargerService} from "../../services/icharger.service";
import {Channel} from "../../models/channel";

@Component({
    selector: 'charger-status',
    templateUrl: 'charger-status.html'
})
export class ChargerStatusComponent {

    @Input() status;
    @Input() channel;
    chargerStatus: {} = {};
    channelObject: Channel = null;

    constructor(public chargerService: iChargerService) {
    }

    ngOnChanges(changes) {
        if (this.status) {
            this.status.subscribe((data) => {
                this.chargerStatus = data;
            });
        }

        if (this.channel) {
            this.channel.subscribe((data) => {
                this.channelObject = data;
            })
        }
    }

    tempAtWarningLevel(): boolean {
        if (this.channelObject != null) {
            return this.channelObject.charger_internal_temp >= 48.0;
        }
        return false;
    }

    tempAtEmergencyLevel(): boolean {
        if (this.channelObject != null) {
            return this.channelObject.charger_internal_temp >= 50.0;
        }
        return false;
    }
}
