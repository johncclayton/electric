import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IConfig} from "../../models/state/config";
import {NavController, Platform} from "ionic-angular";
import {isUndefined} from "ionic-angular/util/util";
import {IStatus} from "../../models/state/state";

/**
 * Generated class for the ConfigComponent component.
 *
 * See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
 * for more info on Angular Components.
 */
@Component({
    selector: 'config',
    templateUrl: 'config.html'
})
export class ConfigComponent {
    @Input() config?: IConfig;
    @Input() status?: IStatus;
    @Output() resetToDefaults: EventEmitter<any> = new EventEmitter();
    private mockChargerOriginal: boolean;

    constructor(public navCtrl: NavController, public platform: Platform) {
        // this.mockChargerOriginal = this.ngRedux.mockCharger;
        this.mockChargerOriginal = false;
    }

    ionViewWillLeave() {
        console.log("Leaving config view. Saving config.");
        // TODO: config
        // this.config.saveConfiguration();
    }

    mockValueChanged() {
        // TODO: config
        // return this.mockChargerOriginal != this.config.getIsUsingMockCharger();
    }

    toggleChargerTempUnits() {
        // this.chargerService.toggleChargerTempUnits().subscribe((result: System) => {
        //     console.info("Toggling C/F. Charger using Celsius: " + result.isCelsius);
        // }, error => {
        //     console.error("Failed to change C/F on charger: " + error);
        // });
    }

    cellChoices() {
        if(isUndefined(this.config) || isUndefined(this.status)) {
            return [];
        }

        let choices = [];
        let maxCells = 10;
        let cellsFromChargerConfig = this.status.cell_count;
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
