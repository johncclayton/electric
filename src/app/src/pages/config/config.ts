import {Component} from "@angular/core";
import {NavController} from "ionic-angular";
import {Configuration} from "../../services/configuration.service";
import {iChargerService} from "../../services/icharger.service";

@Component({
    selector: 'page-config',
    templateUrl: 'config.html'
})
export class ConfigPage {

    constructor(public navCtrl: NavController,
                public chargerService: iChargerService,
                public config: Configuration) {

    }

    ionViewWillLeave() {
        console.log("Leaving config view. Saving config.");
        this.config.saveConfiguration();
    }

    resetToDefaults() {
        this.config.resetToDefaults();
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
