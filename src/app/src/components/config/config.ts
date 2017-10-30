import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IConfig} from "../../models/state/reducers/configuration";
import {NavController, Platform} from "ionic-angular";
import {isUndefined} from "ionic-angular/util/util";
import {IChargerState} from "../../models/state/reducers/charger";
import {IUIState} from "../../models/state/reducers/ui";
import {LocalNotifications} from "@ionic-native/local-notifications";
import {System} from "../../models/system";

@Component({
    selector: 'config',
    templateUrl: 'config.html'
})
export class ConfigComponent {
    mockValueChanged: boolean;

    // huh. should probably refactor this to simply take the entire ngRedux IAppState
    @Input() ui?: IUIState;
    @Input() config?: IConfig;
    @Input() charger?: IChargerState;
    @Input() showAutoButton: boolean;

    @Output() resetToDefaults: EventEmitter<any> = new EventEmitter();
    @Output() updateConfiguration: EventEmitter<any> = new EventEmitter();
    @Output() testFunc: EventEmitter<any> = new EventEmitter();

    private lastUsedDiscoveryIndex = 0;

    constructor(public navCtrl: NavController,
                public notifications: LocalNotifications,
                public platform: Platform) {
    }

    ngOnDestroy() {
    }

    autoDetect() {
        if (this.config.discoveredServers != null) {
            console.log("Have: ", this.config.discoveredServers.join(","));
            if (this.config.discoveredServers.length > 0) {
                if (this.lastUsedDiscoveryIndex > this.config.discoveredServers.length - 1) {
                    this.lastUsedDiscoveryIndex = 0;
                }
                this.config.ipAddress = this.config.discoveredServers[this.lastUsedDiscoveryIndex];
                this.lastUsedDiscoveryIndex++;
            }
        }
    }

    ngOnInit() {
        this.mockValueChanged = false;
    }

    num(value) {
        return parseInt(value);
    }

    change(keyName, value) {
        if (keyName == "mockCharger") {
            this.mockValueChanged = true;
        }

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

    get isProduction(): boolean {
        return System.isProduction;
    }
}
