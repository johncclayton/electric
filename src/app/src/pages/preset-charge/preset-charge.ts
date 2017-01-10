import {Component} from "@angular/core";
import {NavController, NavParams} from "ionic-angular";
import {Configuration} from "../../services/configuration.service";
import {Preset, LipoBalanceType, BalanceEndCondition} from "../preset/preset-class";


export class PresetBasePage {
    preset: Preset;

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
    // Gotta have this, else DI doens't work? Huh?
    constructor(navCtrl: NavController, config: Configuration, navParams: NavParams) {
        super(navCtrl, config, navParams);
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

}

