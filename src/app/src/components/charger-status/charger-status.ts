import {Component, Input} from '@angular/core';
import {iChargerService} from "../../services/icharger.service";
import {Channel} from "../../models/channel";
import {Observable} from "rxjs/Observable";

@Component({
    selector: 'charger-status',
    templateUrl: 'charger-status.html'
})
export class ChargerStatusComponent {

    @Input() status;
    @Input() channels: Array<Observable<any>>;

    private channelObject: {};

    private channelObjects: Array<Channel> = [];

    constructor(public chargerService: iChargerService) {
        this.resetCombinedState();
    }

    ngOnChanges(changes) {
        if (this.status) {
            this.status.subscribe((data) => {
                // this.chargerStatus = data;
            });
        }

        if (this.channels) {
            for (let ch of this.channels) {
                ch.subscribe((data: Channel) => {
                    this.channelObjects[data.index] = data;

                    this.resetCombinedState();

                    // Sum it all up
                    this.channelObjects.map((c: Channel) => {
                        this.channelObject['output_amps'] += c.output_amps;
                        this.channelObject['total_capacity'] += c.output_capacity;

                        // Wonder why this is on Channel?
                        this.channelObject['input_volts'] = c.input_volts;
                        this.channelObject['charger_internal_temp'] = c.charger_internal_temp;
                    })
                })
            }
        }
    }

    private resetCombinedState() {
        this.channelObject = {
            'input_volts': 0,
            'output_amps': 0,
            'total_capacity': 0,
            'charger_internal_temp': 0,
        };
    }

    tempAtWarningLevel(): boolean {
        if (this.channelObject != null) {
            return this.channelObject['charger_internal_temp'] >= 48.0;
        }
        return false;
    }

    tempAtEmergencyLevel(): boolean {
        if (this.channelObject != null) {
            return this.channelObject['charger_internal_temp'] >= 50.0;
        }
        return false;
    }
}
