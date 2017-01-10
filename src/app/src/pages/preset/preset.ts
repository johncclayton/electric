import {Component} from "@angular/core";
import {NavController, NavParams} from "ionic-angular";
import {Configuration} from "../../services/configuration.service";
import {PresetChargePage} from "../preset-charge/preset-charge";
import {Preset} from "./preset-class";

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
            {title: 'Storage', component: PresetChargePage},
            {title: 'Discharging', component: PresetChargePage},
            {title: 'Cycle', component: PresetChargePage},
            {title: 'Balancing', component: PresetChargePage},
        ];

    }

    ionViewDidLoad() {
        this.switchTo(PresetChargePage);
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

