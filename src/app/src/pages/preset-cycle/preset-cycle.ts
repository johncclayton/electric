import {Component} from "@angular/core";
import {PresetBasePage} from "../preset-charge/preset-charge";
import {NavController, NavParams} from "ionic-angular";
import {Configuration} from "../../services/configuration.service";
import {Cycle} from "../../models/preset-class";
import {FormBuilder} from "@angular/forms";
import {ChargerValidator} from "../../utils/validators";

@Component({
    selector: 'page-preset-cycle',
    templateUrl: 'preset-cycle.html'
})
export class PresetCyclePage extends PresetBasePage {
    cycleGroup;

    constructor(navCtrl: NavController,
                private formBuilder: FormBuilder,
                config: Configuration,
                navParams: NavParams) {
        super(navCtrl, config, navParams);
    }

    ngOnInit() {
        this.cycleGroup = this.formBuilder.group({
            delayTime: [this.preset.cycle_delay,
                ChargerValidator.number({
                    min: 0.00,
                    max: 1000
                })],

        });
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
        let list = [];
        for (let num = 1; num < 99; num++) {
            list.push({'value': num, 'text': num.toString() + ""});
        }
        return list;
    }

}
