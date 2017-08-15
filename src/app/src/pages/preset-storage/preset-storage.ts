import {Component} from "@angular/core";
import {PresetBasePage} from "../preset-charge/preset-charge";
import {NavController, NavParams} from "ionic-angular";

@Component({
    selector: 'page-preset-storage',
    templateUrl: 'preset-storage.html'
})
export class PresetStoragePage extends PresetBasePage {

    constructor(navCtrl: NavController, navParams: NavParams) {
        super(navCtrl, navParams);
    }

    storageCellVoltOptions() {
        let list = [];
        let minMax = this.preset.storageVoltageRange();
        for (let num = minMax['min']; num <= minMax['max']; num++) {
            let capacity = num / 100.0;
            list.push({'value': capacity, 'text': capacity.toString() + "V/Cell"});
        }
        return list;
    }

    storageCompensationOptions() {
        let list = [];
        for (let num = 0; num <= 20; num++) {
            list.push({'value': num, 'text': (num / 100).toString() + "V/Cell"});
        }
        return list;
    }
}
