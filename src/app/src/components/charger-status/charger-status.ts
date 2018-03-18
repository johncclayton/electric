import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {IChargerState} from "../../models/state/reducers/charger";
import {IConfig} from "../../models/state/reducers/configuration";
import {ISystem} from "../../models/state/reducers/system";
import {System} from "../../models/system";

@Component({
    selector: 'charger-status',
    templateUrl: 'charger-status.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChargerStatusComponent {

    @Input() system: ISystem;
    @Input() charger: IChargerState;

    constructor() {
    }

    unitOfMeasure() {
        return System.unitsOfMeasure(this.system.system.isCelsius);
    }

    tempAtWarningLevel(): boolean {
        return this.charger.charger_temp >= 48.0;
    }

    tempAtEmergencyLevel(): boolean {
        return this.charger.charger_temp >= 50.0;
    }
}
