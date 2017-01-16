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
        for (let i = 1; i <= maxCells; i++) {
            choices.push(i);
        }
        return choices;
    }
}
