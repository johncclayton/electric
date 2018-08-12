import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {PresetBasePage} from '../preset-charge/preset-charge.page';
import {DataBagService} from '../../services/data-bag.service';
import {Cycle} from '../../models/preset-class';
import {NavController} from '@ionic/angular';

@Component({
    selector: 'app-preset-cycle',
    templateUrl: './preset-cycle.page.html',
    styleUrls: ['./preset-cycle.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresetCyclePage extends PresetBasePage implements OnInit {
    __cycleOptions;

    constructor(navCtrl: NavController, dataBag: DataBagService) {
        super(navCtrl, dataBag);
    }

    ngOnInit() {
        let list = [];
        for (let num = 1; num < 99; num++) {
            list.push({'value': num, 'text': num.toString() + ''});
        }
        this.__cycleOptions = list;
    }

    cycleModeOptions() {
        return [
            {'value': Cycle.ChargeDischarge, 'text': 'Charge -> Discharge'},
            {'value': Cycle.DischargeCharge, 'text': 'Discharge -> Charge'},
            {'value': Cycle.ChargeDischargeCharge, 'text': 'Charge -> Discharge, Charge'},
            {'value': Cycle.DischargeChargeDischarge, 'text': 'Discharge -> Charge, Discharge'},
            {'value': Cycle.ChargeDischargeStore, 'text': 'Charge -> Discharge, Store'},
            {'value': Cycle.DischargeChargeStore, 'text': 'Discharge -> Charge, Store'},
        ];
    }

    cycleCountOptions() {
        return this.__cycleOptions;
    }
}
