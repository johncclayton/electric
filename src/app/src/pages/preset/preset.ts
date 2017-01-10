import {Component} from "@angular/core";
import {NavController, NavParams} from "ionic-angular";
import {Configuration} from "../../services/configuration.service";
import {PresetChargePage} from "../preset-charge/preset-charge";
import {Preset} from "./preset-class";
import {PresetStoragePage} from "../preset-storage/preset-storage";
import {PresetDischargePage} from "../preset-discharge/preset-discharge";
import {PresetCyclePage} from "../preset-cycle/preset-cycle";

@Component({
    selector: 'page-preset',
    templateUrl: 'preset.html'
})
export class PresetPage {
    preset: Preset = null;
    optionsPages;

    constructor(public navCtrl: NavController,
                public config: Configuration,
                public navParams: NavParams) {
        this.preset = navParams.data;

        this.optionsPages = [
            {title: 'Charging', component: PresetChargePage},
            {title: 'Storage', component: PresetStoragePage},
            {title: 'Discharging', component: PresetDischargePage},
            {title: 'Cycle', component: PresetCyclePage},
            // Don't see options in the charger, so dunno what to do here
            // {title: 'Balancing', component: PresetBalancePage},
        ];

    }

    ionViewDidLoad() {
        // This was used for testing, to quickly get to a page I was working on
        // this.switchTo(PresetChargePage);
        // this.switchTo(PresetDischargePage);
        // this.switchTo(PresetStoragePage);
        // this.switchTo(PresetCyclePage);
    }

    cellChoices() {
        let choices = [];
        choices.push({'value': 0, 'text': 'Any'});
        for (let i = 0; i < this.config.getNumberOfChannels(); i++) {
            choices.push({'value': i + 1, 'text': (i + 1).toString()});
        }
        return choices;
    }

    currentChoices() {
        let choices = [0.25, 0.5];
        for (let i = 1; i <= this.config.getMaxAmpsPerChannel(); i++) {
            choices.push(i);
        }
        return choices;
    }

    switchTo(page) {
        this.navCtrl.push(page, this.preset);
    }
}

