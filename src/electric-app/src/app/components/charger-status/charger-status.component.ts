import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {IChargerState} from '../../models/state/reducers/charger';
import {System} from '../../models/system';
import {ISystem} from '../../models/state/reducers/system';

@Component({
    selector: 'charger-status',
    templateUrl: './charger-status.component.html',
    styleUrls: ['./charger-status.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChargerStatusComponent implements OnInit {
    @Input() system: ISystem;
    @Input() charger: IChargerState;

    constructor() {
    }

    ngOnInit() {
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
