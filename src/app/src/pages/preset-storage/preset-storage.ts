import {Component} from "@angular/core";
import {PresetBasePage} from "../preset-charge/preset-charge";
import {NavController, NavParams} from "ionic-angular";
import {Configuration} from "../../services/configuration.service";

@Component({
    selector: 'page-preset-storage',
    templateUrl: 'preset-storage.html'
})
export class PresetStoragePage extends PresetBasePage {

    constructor(navCtrl: NavController, config: Configuration, navParams: NavParams) {
        super(navCtrl, config, navParams);
    }

    storageCellVoltOptions() {
        let list = [];
        for (let num = 370; num <= 390; num++) {
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
