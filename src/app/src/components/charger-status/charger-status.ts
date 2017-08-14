import {Component, Input} from '@angular/core';
import {IChargerState} from "../../models/state/reducers/charger";
import {IConfig} from "../../models/state/reducers/configuration";

@Component({
    selector: 'charger-status',
    templateUrl: 'charger-status.html'
})
export class ChargerStatusComponent {

    @Input() config: IConfig;
    @Input() charger: IChargerState;

    constructor() {    }

    unitOfMeasure() {
        if (this.config.unitsCelsius) {
            return "°C";
        }
        return "°F";
    }

    tempAtWarningLevel(): boolean {
        return this.charger.charger_temp >= 48.0;
    }

    tempAtEmergencyLevel(): boolean {
        return this.charger.charger_temp >= 50.0;
    }
}
