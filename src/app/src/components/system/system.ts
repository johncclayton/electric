import {Component, EventEmitter, Input, Output} from '@angular/core';
import {SystemActions} from "../../models/state/actions/system";
import {ISystem} from "../../models/state/reducers/system";
import {IUIState} from "../../models/state/reducers/ui";
import {System} from "../../models/system";

@Component({
    selector: 'system-display',
    templateUrl: 'system.html'
})
export class SystemComponent {
    @Input() system: ISystem;
    @Input() ui: IUIState;

    @Output() saveSettings: EventEmitter<any> = new EventEmitter();

    get charger() : System {
        return this.system.system;
    }

    constructor(private actions: SystemActions) {
    }


}
