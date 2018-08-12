import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {NavController} from '@ionic/angular';
import {BalanceEndCondition, ChemistryType, LipoBalanceType, Preset} from '../../models/preset-class';
import {DataBagService} from '../../services/data-bag.service';
import {celciusToF} from '../../utils/helpers';
import {System} from '../../models/system';
import {SavePresetInterface} from '../preset/preset.page';
import * as _ from "lodash";

export class PresetBasePage {
    public preset: Preset;

    private saver: SavePresetInterface;

    private _safetyTemp;
    private _safetyCapacity;

    constructor(public navCtrl: NavController,
                public dataBag: DataBagService) {
        const navParams = this.dataBag.get('preset');
        if(navParams !== undefined) {
            this.preset = navParams['preset'];
            this.saver = navParams['saver'];
        } else {
            this.navCtrl.goBack('PresetList');
        }
    }

    public safetyTempOptions() {
        if(this._safetyTemp === undefined) {
            let list = [];
            for (let num = 200; num < 800; num += 5) {
                let celcius = (num / 10);
                let farenheight = celciusToF(celcius);
                list.push({
                    'value': celcius,
                    'text': celcius.toString() + System.CELSIUS + " / " + farenheight + System.FARENHEIGHT
                });
            }
            this._safetyTemp = list;
        }
        return this._safetyTemp;
    }

    public safetyCapacityOptions() {
        if(this._safetyCapacity ===undefined) {
            let list = [];
            for (let num = 50; num < 200; num += 5) {
                let capacity = num;
                list.push({'value': capacity, 'text': capacity.toString() + "%"});
            }
            this._safetyCapacity = list;
        }
        return this._safetyCapacity;
    }

    savePreset() {
        if (this.saver) {
            this.saver.savePreset((p) => {
            });
        }
    }
}

@Component({
    selector: 'app-preset-charge',
    templateUrl: './preset-charge.page.html',
    styleUrls: ['./preset-charge.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresetChargePage extends PresetBasePage implements OnInit {
    constructor(navCtrl: NavController, dataBag: DataBagService) {
        super(navCtrl, dataBag);
    }

    ngOnInit() {
    }

    isLipo() {
        return this.preset.type == ChemistryType.LiPo ||
            this.preset.type == ChemistryType.LiFe;
    }

    isNiMH() {
        return this.preset.type == ChemistryType.NiMH;
    }

    chargeModeOptions() {
        let modes = [];
        switch (this.preset.type) {
            case ChemistryType.NiMH:
                modes = [
                    {'value': 0, 'text': 'Normal'},
                    {'value': 1, 'text': 'Reflex'}];
        }
        return modes;
    }

    balanceOptions() {
        return [
            {'value': LipoBalanceType.Slow, 'text': 'Slow'},
            {'value': LipoBalanceType.Normal, 'text': 'Normal'},
            {'value': LipoBalanceType.Fast, 'text': 'Fast'},
            {'value': LipoBalanceType.User, 'text': 'User'},
            {'value': LipoBalanceType.DontBalance, 'text': 'Dont Balance'},
        ];
    }

    chargeEndOptions() {
        return [
            {'value': BalanceEndCondition.EndCurrentOff_DetectBalanceOn, 'text': 'Detect Balance Only'},
            {'value': BalanceEndCondition.EndCurrentOn_DetectBalanceOff, 'text': 'End Current Only'},
            {'value': BalanceEndCondition.EndCurrent_or_DetectBalance, 'text': 'Balance or Current'},
            {'value': BalanceEndCondition.EndCurrent_and_DetectBalance, 'text': 'Balance and Current'},
        ]
    }

    chargeEndOptionUsesEndCurrent() {
        let valid_values = [BalanceEndCondition.EndCurrent_and_DetectBalance, BalanceEndCondition.EndCurrent_and_DetectBalance, BalanceEndCondition.EndCurrentOn_DetectBalanceOff];
        return _.includes(valid_values, this.preset.balance_end_type);
    }

    restoreVoltageOptions() {
        let list = [];
        for (let num = 5; num < 25; num++) {
            let number = (num / 10);
            list.push({'value': number, 'text': number.toString() + "V"});
        }
        return list;
    }

    restoreChargeTimeOptions() {
        return [
            {'value': 1, 'text': '1 min'},
            {'value': 2, 'text': '2 min'},
            {'value': 3, 'text': '3 min'},
            {'value': 4, 'text': '4 min'},
            {'value': 5, 'text': '5 min'},
        ];
    }

    restoreCurrentOptions() {
        let list = [];
        for (let num = 2; num < 50; num++) {
            let number = (num / 100);
            list.push({'value': number, 'text': number.toString() + "A"});
        }
        return list;
    }

    nimhTrickelEnabled() {
        return this.preset.trickle_enabled;
    }

    nimhSensitivityOptions() {
        let list = [];
        for (let num = 1; num < 20; num++) {
            list.push({'value': num, 'text': num.toString() + "mV"});
        }
        return list;
    }

    nimhDelayTimeOptions() {
        let list = [];
        for (let num = 0; num < 20; num++) {
            list.push({'value': num, 'text': num.toString() + "min"});
        }
        return list;
    }

    nimhTrickleCurrentOptions() {
        let list = [];
        for (let num = 20; num < 100; num++) {
            let actual = num / 100;
            list.push({'value': actual, 'text': actual.toString() + "A"});
        }
        return list;
    }

    generalMinuteOptions(start: number, end: number) {
        let list = [];
        for (let num = start; num < end; num++) {
            list.push({'value': num, 'text': num.toString() + "min"});
        }
        return list;
    }
}
