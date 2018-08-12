import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {PresetBasePage} from '../preset-charge/preset-charge.page';
import {NavController} from '@ionic/angular';
import {DataBagService} from '../../services/data-bag.service';

@Component({
    selector: 'app-preset-storage',
    templateUrl: './preset-storage.page.html',
    styleUrls: ['./preset-storage.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresetStoragePage extends PresetBasePage implements OnInit {
    private _voltageRanges;
    private _compensationOptions;

    constructor(navCtrl: NavController, dataBag: DataBagService) {
        super(navCtrl, dataBag);
    }

    ngOnInit() {
        if (this.preset === undefined) {
            this.navCtrl.goBack('Preset');
            return;
        }
        let list = [];
        let minMax = this.preset.storageVoltageRange();
        for (let num = minMax['min']; num <= minMax['max']; num++) {
            let capacity = num / 100.0;
            list.push({'value': capacity, 'text': capacity.toString() + 'V/Cell'});
        }
        this._voltageRanges = list;

        list = [];
        for (let num = 0; num <= 20; num++) {
            list.push({'value': num, 'text': (num / 100).toString() + 'V/Cell'});
        }
        this._compensationOptions = list;
    }

    get storageCellVoltOptions() {
        return this._voltageRanges;
    }

    get storageCompensationOptions() {
        return this._compensationOptions;
    }
}
