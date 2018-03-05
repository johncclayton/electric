import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ISystem} from "../../models/state/reducers/system";
import {IUIState} from "../../models/state/reducers/ui";
import {IChargerCaseFan, System} from "../../models/system";

@Component({
    selector: 'system-display',
    templateUrl: 'system.html'
})
export class SystemComponent {
    _system: ISystem;

    @Input()
    get system(): ISystem {
        return this._system;
    }

    set system(value: ISystem) {
        this._system = Object.create(value);
        console.log("*** New system value was provided to the system UI component");
    }

    @Input() ui: IUIState;

    @Output() valueWasChanged: EventEmitter<any> = new EventEmitter();
    @Output() saveSettings: EventEmitter<any> = new EventEmitter();

    get charger(): System {
        return this.system.system;
    }

    get case_fan(): IChargerCaseFan {
        return this.system.case_fan;
    }

    get can_do_case_fan(): boolean {
        return this.system.system.has_case_fan;
    }

    constructor() {
    }

    change(keyName, event) {
        this.system[keyName] = event.value;
        // let change = [];
        // change[keyName] = event.value;
        // this.valueWasChanged.emit(change);
    }

}
