import {Component} from "@angular/core";
import {NavController, NavParams} from "ionic-angular";
import {Configuration} from "../../services/configuration.service";
import {Preset, LipoBalanceType, BalanceEndCondition, ChemistryType} from "../../models/preset-class";
import {FormBuilder} from "@angular/forms";


export class PresetBasePage {
    public preset: Preset;

    constructor(public navCtrl: NavController,
                public config: Configuration,
                public navParams: NavParams) {
        this.preset = navParams.data;
    }

    celciusToF(c) {
        return c * 9 / 5 + 32;
    }

    public safetyTempOptions() {
        let list = [];
        for (let num = 200; num < 800; num += 5) {
            let celcius = (num / 10);
            let farenheight = this.celciusToF(celcius);
            list.push({'value': celcius, 'text': celcius.toString() + "°C / " + farenheight + "°F"});
        }
        return list;
    }

    public safetyCapacityOptions() {
        let list = [];
        for (let num = 50; num < 200; num += 5) {
            let capacity = num;
            list.push({'value': capacity, 'text': capacity.toString() + "%"});
        }
        return list;
    }
}

@Component({
    selector: 'page-preset-charge',
    templateUrl: 'preset-charge.html'
})
export class PresetChargePage extends PresetBasePage {
    // nimhGroup;

    // Gotta have this, else DI doens't work? Huh?
    constructor(navCtrl: NavController,
                config: Configuration,
                public formBuilder: FormBuilder,
                navParams: NavParams) {
        super(navCtrl, config, navParams);
    }

    ngOnInit() {
        // this.nimhGroup = this.formBuilder.group({
        //     trickleTimeout: [
        //         this.preset.trickle_timeout,
        //         ChargerValidator.number({
        //             min: 1,
        //         })
        //     ],
        // });
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

