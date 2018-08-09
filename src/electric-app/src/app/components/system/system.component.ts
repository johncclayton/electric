import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IUIState} from '../../models/state/reducers/ui';
import {ISystem} from '../../models/state/reducers/system';
import {IChargerCaseFan, System} from '../../models/system';

//import {cloneDeep} from 'lodash';

@Component({
    selector: 'system',
    templateUrl: './system.component.html',
    styleUrls: ['./system.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SystemComponent implements OnInit {
    @Input() ui: IUIState;

    @Output() valueWasChanged: EventEmitter<any> = new EventEmitter();
    @Output() saveSettings: EventEmitter<any> = new EventEmitter();

    _system: ISystem;

    @Input()
    get system(): ISystem {
        return this._system;
    }

    set system(value: ISystem) {
        this._system = value;
        console.debug(`*** New system value was provided to the system UI component: ${JSON.stringify(this._system)}`);
    }

    constructor() {
    }

    debugStuff() {
        return JSON.stringify(this.charger.constructor.name);
    }

    ngOnInit() {
    }

    get charger(): System {
        return this.system.system;
    }

    get case_fan(): IChargerCaseFan {
        return this.system.case_fan;
    }

    get can_do_case_fan(): boolean {
        return this.system.system.has_case_fan;
    }

    change(keyName, event) {
        this.system[keyName] = event.value;
        // let change = [];
        // change[keyName] = event.value;
        // this.valueWasChanged.emit(change);
    }


}
