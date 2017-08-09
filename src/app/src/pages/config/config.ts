import {Component} from "@angular/core";
import {NavController} from "ionic-angular";
import {Configuration} from "../../services/configuration.service";
import {iChargerService} from "../../services/icharger.service";
import {System} from "../../models/system";

@Component({
    selector: 'page-config',
    templateUrl: 'config.html'
})
export class ConfigPage {
    mockChargerOriginal: boolean;

    constructor(public navCtrl: NavController,
                public chargerService: iChargerService,
                public config: Configuration) {
        this.mockChargerOriginal = this.config.getIsUsingMockCharger();
    }

    ionViewWillLeave() {
        console.log("Leaving config view. Saving config.");
        this.config.saveConfiguration();
    }

    resetToDefaults() {
        this.config.resetToDefaults();
    }

    mockValueChanged() {
        return this.mockChargerOriginal != this.config.getIsUsingMockCharger();
    }

    toggleChargerTempUnits() {
        this.chargerService.toggleChargerTempUnits().subscribe((result: System) => {
            console.info("Toggling C/F. Charger using Celsius: " + result.isCelsius);
        }, error => {
            console.error("Failed to change C/F on charger: " + error);
        });
    }

    cellChoices() {
        let choices = [];
        let maxCells = 10;
        let cellsFromChargerConfig = this.chargerService.getMaxCells();
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
