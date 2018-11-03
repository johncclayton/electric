import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {NavController} from '@ionic/angular';
import {BalanceEndCondition, ChemistryType, LipoBalanceType, Preset} from '../../models/preset-class';
import {DataBagService} from '../../services/data-bag.service';
import {SavePresetInterface} from '../preset/preset.page';
import * as _ from 'lodash';
import {iChargerPickLists} from '../../utils/picklists';
import {Observable, of} from 'rxjs';

export class PresetBasePage {
    private saver: SavePresetInterface;

    constructor(public navCtrl: NavController,
                public chargerLists: iChargerPickLists,
                public dataBag: DataBagService) {
        const navParams = this.dataBag.get('preset');
        if (navParams === undefined) {
            this.navCtrl.navigateRoot('home');
        }
        this.saver = this.dataBag.get('preset-saver');
    }

    canDeactivate(): Observable<boolean> {
        if (this.saver) {
            return this.saver.canDeactivate();
        }
        console.warn('No preset saver set, cannot return intelligen canDeactivate, assuming "true"');
        return of(true);
    }

    get preset(): Preset {
        return this.saver.getPreset();
    }

    savePreset() {
        if (this.saver) {
            this.saver.savePreset((p) => {
                console.log(`Saver saved ok`);
            });
        } else {
            console.warn('No preset saver set, cannot save');
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
    constructor(navCtrl: NavController, public chargerLists: iChargerPickLists, dataBag: DataBagService) {
        super(navCtrl, chargerLists, dataBag);
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
        switch (this.preset.type) {
            case ChemistryType.NiMH:
                return this.chargerLists.listNamed('chargeModeOptions', () => {
                    return [
                        {'value': 0, 'text': 'Normal'},
                        {'value': 1, 'text': 'Reflex'}
                    ];
                });
        }
        return [];
    }

    balanceOptions() {
        return this.chargerLists.listNamed('balanceOptions', () => {
            return [
                {'value': LipoBalanceType.Slow, 'text': 'Slow'},
                {'value': LipoBalanceType.Normal, 'text': 'Normal'},
                {'value': LipoBalanceType.Fast, 'text': 'Fast'},
                {'value': LipoBalanceType.User, 'text': 'User'},
                {'value': LipoBalanceType.DontBalance, 'text': 'Don\'t Balance'},
            ];
        });
    }

    chargeEndOptions() {
        return this.chargerLists.chargeEndOptions();
    }

    chargeEndOptionUsesEndCurrent() {
        let validValues = [BalanceEndCondition.EndCurrent_and_DetectBalance, BalanceEndCondition.EndCurrent_or_DetectBalance, BalanceEndCondition.EndCurrentOn_DetectBalanceOff];
        // console.log(`Valid values: ${validValues}, current value: ${this.preset.balance_end_type}`);
        return _.includes(validValues, this.preset.balance_end_type);
    }

    restoreVoltageOptions() {
        return this.chargerLists.listNamed('restoreVoltageOptions', () => {
            let list = [];
            for (let num = 5; num < 25; num++) {
                let number = (num / 10);
                list.push({'value': number, 'text': number.toString() + 'V'});
            }
            return list;
        });
    }

    restoreChargeTimeOptions() {
        return this.chargerLists.listNamed('restoreChargeTimeOptions', () => {
            return [
                {'value': 1, 'text': '1 min'},
                {'value': 2, 'text': '2 min'},
                {'value': 3, 'text': '3 min'},
                {'value': 4, 'text': '4 min'},
                {'value': 5, 'text': '5 min'},
            ];
        });
    }

    restoreCurrentOptions() {
        return this.chargerLists.listNamed('restoreCurrentOptions', () => {
            let list = [];
            for (let num = 2; num < 50; num++) {
                let number = (num / 100);
                list.push({'value': number, 'text': number.toString() + 'A'});
            }
            return list;
        });
    }

    nimhTrickelEnabled() {
        return this.preset.trickle_enabled;
    }

    nimhSensitivityOptions() {
        return this.chargerLists.listNamed('nimhSensitivityOptions', () => {
            let list = [];
            for (let num = 1; num < 20; num++) {
                list.push({'value': num, 'text': num.toString() + 'mV'});
            }
            return list;
        });
    }

    nimhDelayTimeOptions() {
        return this.chargerLists.listNamed('nimhDelayTimeOptions', () => {
            let list = [];
            for (let num = 0; num < 20; num++) {
                list.push({'value': num, 'text': num.toString() + 'min'});
            }
            return list;
        });
    }

    nimhTrickleCurrentOptions() {
        return this.chargerLists.listNamed('nimhTrickleCurrentOptions', () => {
            let list = [];
            for (let num = 20; num < 100; num++) {
                let actual = num / 100;
                list.push({'value': actual, 'text': actual.toString() + 'A'});
            }
            return list;
        });
    }

    generalMinuteOptions(start: number, end: number) {
        return this.chargerLists.listNamed('generalMinuteOptions', () => {
            let list = [];
            for (let num = start; num < end; num++) {
                list.push({'value': num, 'text': num.toString() + 'min'});
            }
            return list;
        });
    }
}
