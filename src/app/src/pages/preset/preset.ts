import {Component} from "@angular/core";
import {NavController, NavParams} from "ionic-angular";
import {Configuration} from "../../services/configuration.service";
import {PresetChargePage} from "../preset-charge/preset-charge";
import {Preset, ChemistryType} from "./preset-class";
import {PresetStoragePage} from "../preset-storage/preset-storage";
import {PresetDischargePage} from "../preset-discharge/preset-discharge";
import {PresetCyclePage} from "../preset-cycle/preset-cycle";
import {iChargerService} from "../../services/icharger.service";

@Component({
    selector: 'page-preset',
    templateUrl: 'preset.html'
})
export class PresetPage {
    preset: Preset = null;
    optionsPages;

    constructor(public navCtrl: NavController,
                public config: Configuration,
                public chargerService: iChargerService,
                public navParams: NavParams) {
        this.preset = navParams.data;

        this.optionsPages = [
            {title: 'Charging', component: PresetChargePage},
            {title: 'Discharging', component: PresetDischargePage},
            {title: 'Cycle', component: PresetCyclePage},

            // Don't see options in the charger, so dunno what to do here
            // {title: 'Balancing', component: PresetBalancePage},
        ];

        if (this.preset.type == ChemistryType.LiPo ||
            this.preset.type == ChemistryType.LiFe) {
            this.optionsPages.push(
                {title: 'Storage', component: PresetStoragePage}
            );
        }

    }

    ionViewDidLoad() {
        // This was used for testing, to quickly get to a page I was working on
        // this.switchTo(PresetChargePage);
        // this.switchTo(PresetDischargePage);
        // this.switchTo(PresetStoragePage);
        // this.switchTo(PresetCyclePage);
    }

    refreshPreset(refresher) {
        // TODO: what if there are unsaved changes?
        // TODO: Causes a bug where the preset list itself isnt refreshed
        this.chargerService.getPresets().subscribe((presetList) => {
            let wantedPreset = presetList[this.preset.index];
            if (wantedPreset) {
                this.preset = wantedPreset;
            }
            refresher.complete();
        });
    }

    showCells() {
        return this.preset.type == ChemistryType.LiPo ||
            this.preset.type == ChemistryType.LiFe;
    }

    typeChoices() {
        return [
            {'value': ChemistryType.LiPo, 'text': 'LiPo'},
            {'value': ChemistryType.LiLo, 'text': 'LiLo'},
            {'value': ChemistryType.LiFe, 'text': 'LiFe'},
            {'value': ChemistryType.NiMH, 'text': 'NiMH'},
            {'value': ChemistryType.NiCd, 'text': 'NiCd'},
            {'value': ChemistryType.Pb, 'text': 'Pb'},
            {'value': ChemistryType.NiZn, 'text': 'NiZn'},
        ];
    }

    cellChoices() {
        let choices = [];
        choices.push({'value': 0, 'text': 'Auto'});
        for (let i = 0; i < this.chargerService.getNumberOfChannels(); i++) {
            choices.push({'value': i + 1, 'text': (i + 1).toString()});
        }
        return choices;
    }

    currentChoices() {
        let choices = [{value: 0.25, text: "0.25A"}, {value: 0.5, text: "0.5A"}];
        for (let i = 10; i <= this.chargerService.getMaxAmpsPerChannel() * 10; i++) {
            let real = i / 10;
            choices.push({'value': real, 'text': (real).toString() + "A"});
        }
        return choices;
    }

    switchTo(page) {
        this.navCtrl.push(page, this.preset);
    }
}

