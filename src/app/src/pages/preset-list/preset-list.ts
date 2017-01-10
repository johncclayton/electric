import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, List} from 'ionic-angular';
import {iChargerService} from "../../services/icharger.service";
import {PresetPage} from "../preset/preset";
import {Preset} from "../preset/preset-class";

@Component({
    selector: 'page-preset-list',
    templateUrl: 'preset-list.html'
})
export class PresetListPage {
    public presets: Array<Preset>;
    @ViewChild(List) list: List;

    constructor(public navCtrl: NavController,
                public chargerService: iChargerService,
                public navParams: NavParams) {
    }

    ionViewDidLoad() {
        this.chargerService.getPresets().subscribe(presetsList => {
            this.presets = presetsList;

            if (this.presets.length) {
                this.navCtrl.push(PresetPage, this.presets[1]);
            }
        });
    }

    editPreset(preset) {
        this.navCtrl.push(PresetPage, preset);
    }

    chemistyClass(preset) {
        return "chemistry-" + preset['type_str'];
    }

    tagsForPreset(preset) {
        let tags = [];
        if (preset.type_str) {
            tags.push(preset.type_str);
        } else {
            tags.push("Unknown");
        }
        if (preset['charge_current']) {
            tags.push("+ " + preset['charge_current'] + 'A');
        }
        if (preset['discharge_current']) {
            tags.push("- " + preset['discharge_current'] + 'A');
        }
        return tags;
    }
}
