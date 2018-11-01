import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {NavController} from '@ionic/angular';
import {iChargerService} from '../../services/icharger.service';
import {DataBagService} from '../../services/data-bag.service';
import {PresetBasePage} from '../preset-charge/preset-charge.page';
import {Subject} from 'rxjs';
import {ChemistryType, RegenerativeMode, RegenerativeToChannelMethod} from '../../models/preset-class';

@Component({
    selector: 'app-preset-discharge',
    templateUrl: './preset-discharge.page.html',
    styleUrls: ['./preset-discharge.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresetDischargePage extends PresetBasePage implements OnInit {

    private _currentChoices;

    constructor(navCtrl: NavController,
                public chargerService: iChargerService,
                dataBag: DataBagService) {
        super(navCtrl, dataBag);
    }

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    ngOnInit() {
        if (!this.preset) {
            this.navCtrl.navigateBack('Preset');
        }
    }

    get regenVoltLimitMinMax() {
        return this.preset.dischargeVoltageMinMax();
    }

    get regenCurrentMinMax() {
        return {min: 0.05, max: iChargerService.getMaxAmpsPerChannel()};
    }

    currentChoices() {
        if (this._currentChoices === undefined) {
            let choices = [];
            for (let i = 50; i <= 200; i++) {
                choices.push(i / 100);
            }
            this._currentChoices = choices;
        }
        return this._currentChoices;
    }

    showAdvanced() {
        return this.preset.type == ChemistryType.LiPo ||
            this.preset.type == ChemistryType.LiFe;
    }

    joinDisabled() {
        return this.preset.regeneration_mode == RegenerativeMode.Off ||
            this.preset.regeneration_mode != RegenerativeMode.ToChannel;
    }

    limitsDisabled() {
        // Don't show limits if a) not enabled of b) resistance/bulbs not set
        return this.joinDisabled() || this.preset.regeneration_method != RegenerativeToChannelMethod.ResistanceOrBulbs;
    }

    regenerationModeTypeOptions() {
        return [
            {'value': RegenerativeMode.Off, 'text': 'Off'},
            {'value': RegenerativeMode.ToInput, 'text': 'To input'},
            {'value': RegenerativeMode.ToChannel, 'text': 'To channel'},
        ];
    }

    regenerationMethodOptions() {
        return [
            {'value': RegenerativeToChannelMethod.ResistanceOrBulbs, 'text': 'Resistance / Bulbs'},
            {'value': RegenerativeToChannelMethod.ChargingBattery, 'text': 'Charging battery'},
        ];
    }

}
