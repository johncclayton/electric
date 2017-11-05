import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IConfig} from "../../models/state/reducers/configuration";
import {NavController} from "ionic-angular";
import {isUndefined} from "ionic-angular/util/util";
import {IChargerState} from "../../models/state/reducers/charger";
import {IUIState} from "../../models/state/reducers/ui";
import {LocalNotifications} from "@ionic-native/local-notifications";
import {iChargerService} from "../../services/icharger.service";

@Component({
    selector: 'config',
    templateUrl: 'config.html'
})
export class ConfigComponent {
    @Input() ui?: IUIState;
    @Input() config?: IConfig;
    @Input() charger?: IChargerState;

    @Output() resetToDefaults: EventEmitter<any> = new EventEmitter();
    @Output() updateConfiguration: EventEmitter<any> = new EventEmitter();
    @Output() testFunc: EventEmitter<any> = new EventEmitter();

    constructor(public navCtrl: NavController,
                public chargerService: iChargerService,
                public notifications: LocalNotifications) {
    }


    ngOnInit() {
    }

    num(value) {
        return parseInt(value);
    }

    change(keyName, value) {
        // Check we have permission. If not, request it.
        if (keyName == 'notificationWhenDone' && value) {
            this.notifications.hasPermission().then((havePermission: boolean) => {
                if (!havePermission) {
                    this.notifications.registerPermission();
                }
                this.notifications.schedule({
                    id: 1,
                    text: 'Ping ping ping!'
                });
            });
        }

        let change = [];
        change[keyName] = value;
        this.updateConfiguration.emit(change);
    }

    cellChoices() {
        if (isUndefined(this.config) || isUndefined(this.charger)) {
            return [];
        }

        let choices = [];
        let maxCells = 10;
        let cellsFromChargerConfig = this.charger.cell_count;
        if (cellsFromChargerConfig > 0) {
            maxCells = cellsFromChargerConfig;
        }
        // -1 means: All
        // 0 means: Nothing
        for (let i = -1; i <= maxCells; i++) {
            if (i == -1) {
                choices.push({'value': i, 'text': "All"});
            } else if (i == 0) {
                choices.push({'value': i, 'text': "None"});
            } else {
                choices.push({'value': i, 'text': i.toString() + ""});
            }
        }
        return choices;
    }

}
