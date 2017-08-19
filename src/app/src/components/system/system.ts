import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ISystem} from "../../models/state/reducers/system";
import {IUIState} from "../../models/state/reducers/ui";
import {System} from "../../models/system";

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
        console.log("*** Got new system value");
    }

    @Input() ui: IUIState;

    @Output() valueWasChanged: EventEmitter<any> = new EventEmitter();
    @Output() saveSettings: EventEmitter<any> = new EventEmitter();

    get charger(): System {
        return this.system.system;
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
