import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, List, ToastController} from 'ionic-angular';
import {iChargerService} from "../../services/icharger.service";
import {PresetPage} from "../preset/preset";
import {Preset, ChemistryType} from "../preset/preset-class";
import {Chemistry} from "../../utils/mixins";
import {applyMixins} from "rxjs/util/applyMixins";

@Component({
    selector: 'page-preset-list',
    templateUrl: 'preset-list.html'
})
export class PresetListPage implements Chemistry {
    firstLoad: boolean = true;
    public presets: Array<Preset>;
    @ViewChild(List) list: List;

    constructor(public navCtrl: NavController,
                public chargerService: iChargerService,
                public toastController: ToastController,
                public navParams: NavParams) {
    }

    ionViewDidLoad() {
        this.refreshPresets(null);
    }

    refreshPresets(refresher) {
        this.chargerService.getPresets().subscribe(presetsList => {
            this.presets = presetsList;
            this.firstLoad = false;
            if (refresher) {
                refresher.complete();
            }
            // Was used during testing, to move to a known preset and edit it.
            // if (this.presets.length) {
            //     this.navCtrl.push(PresetPage, this.presets[15]);
            // }
        });
    }

    editPreset(preset) {
        if (preset) {
            console.log("Editing preset type: ", preset.type, "usage: ", preset.data.use_flag);
            if (preset.type == ChemistryType.LiPo ||
                preset.type == ChemistryType.NiMH ||
                preset.type == ChemistryType.LiFe) {
                this.navCtrl.push(PresetPage, {
                    preset: preset,
                    callback: (new_preset) => {
                        if (new_preset) {
                            console.log("Got result ", new_preset, " from the save call");
                            preset.updateFrom(new_preset);
                        }
                    }
                });
            } else {
                let toast = this.toastController.create({
                    message: "Only support editing Lipo for now",
                    duration: 2000,
                    // dismissOnPageChange: true, // causes an exception. meh.
                    position: "top"
                });

                toast.present();
            }
        } else {
            let toast = this.toastController.create({
                message: "Bug: no preset sent to edit",
                duration: 2000,
                position: "top"
            });
            toast.present();
        }
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

    chemistryClass: () => string;
}

applyMixins(PresetListPage, [Chemistry]);