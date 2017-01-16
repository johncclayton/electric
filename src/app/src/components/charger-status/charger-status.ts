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

}
