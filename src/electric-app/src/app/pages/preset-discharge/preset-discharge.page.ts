import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {NavController} from '@ionic/angular';
import {iChargerService} from '../../services/icharger.service';
import {DataBagService} from '../../services/data-bag.service';
import {PresetBasePage} from '../preset-charge/preset-charge.page';
import {Subject} from 'rxjs';
import {ChemistryType, RegenerativeMode, RegenerativeToChannelMethod} from '../../models/preset-class';
import {iChargerPickLists} from '../../utils/picklists';
import {CustomNGXLoggerService} from 'ngx-logger';

@Component({
    selector: 'app-preset-discharge',
    templateUrl: './preset-discharge.page.html',
    styleUrls: ['./preset-discharge.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresetDischargePage extends PresetBasePage implements OnInit {

    private _currentChoices;

    constructor(navCtrl: NavController,
                cs: iChargerPickLists,
                logSvc: CustomNGXLoggerService,
                dataBag: DataBagService) {
        super(navCtrl, cs, logSvc, dataBag);
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
        // this.logger.log(`Join disabled? regen mode: ${this.preset.regeneration_mode}`);
        return this.preset.regeneration_mode == RegenerativeMode.Off ||
            this.preset.regeneration_mode != RegenerativeMode.ToChannel;
    }

    limitsDisabled() {
        // Don't show limits if a) not enabled of b) resistance/bulbs not set
        return this.joinDisabled() || this.preset.regeneration_method != RegenerativeToChannelMethod.ResistanceOrBulbs;
    }
}
