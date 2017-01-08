import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, List} from 'ionic-angular';
import {iChargerService} from "../../services/icharger.service";

@Component({
    selector: 'page-preset-list',
    templateUrl: 'preset-list.html'
})
export class PresetListPage {
    public presets;
    @ViewChild(List) list: List;

    constructor(public navCtrl: NavController,
                public chargerService: iChargerService,
                public navParams: NavParams) {
    }

    ionViewDidLoad() {
        this.chargerService.getPresets().subscribe(presetsList => {
            this.presets = presetsList;
        });
    }

    editPreset(preset) {
        console.log("Edit ", preset);
    }

}
