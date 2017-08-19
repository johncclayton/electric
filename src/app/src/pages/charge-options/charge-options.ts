import {Component} from '@angular/core';
import {NavController, NavParams, Toast, ToastController} from 'ionic-angular';
import {Channel} from "../../models/channel";
import {iChargerService} from "../../services/icharger.service";
import {ChemistryType, Preset} from "../../models/preset-class";
import {Chemistry} from "../../utils/mixins";

import * as _ from "lodash";
import {sprintf} from "sprintf-js";
import {applyMixins} from "rxjs/util/applyMixins";
import {NgRedux} from "@angular-redux/store";
import {IAppState} from "../../models/state/configure";
import {IChargeSettings, IConfig} from "../../models/state/reducers/configuration";
import {ConfigurationActions} from "../../models/state/actions/configuration";
import {IUIState} from "../../models/state/reducers/ui";
import {UIActions} from "../../models/state/actions/ui";

@Component({
    selector: 'page-charge-options',
    templateUrl: 'charge-options.html'
})
export class ChargeOptionsPage implements Chemistry {
    config: IConfig;
    chargeSettings: IChargeSettings;
    ui: IUIState;

    channel: Channel;
    title: string = "Charge";
    showCapacityAndC: boolean = true;
    charging: boolean = true;
    presets: Array<any> = [];

    private callback: any;
    private subscription: any;
    private simpleAlert: Toast;

    public static CHARGE_BY_PLAN_PRESET_NAME: string = "Electric Charge Plan";

    constructor(public navCtrl: NavController,
                public chargerService: iChargerService,
                public actions: ConfigurationActions,
                public uiActions: UIActions,
                public toastController: ToastController,
                public ngRedux: NgRedux<IAppState>,
                public navParams: NavParams) {

        this.channel = navParams.data['channel'];
        this.showCapacityAndC = navParams.data['showCapacityAndC'];
        this.charging = navParams.data['charging'];
        this.title = navParams.data['title'];
        this.callback = navParams.data['callback'];
        this.config = null;
        this.chargeSettings = null;

        this.subscription = ngRedux.select<IConfig>('config').subscribe(c => {
            this.config = c;
            this.chargeSettings = this.config.charge_settings;

            if (!this.showCapacityAndC) {
                // Force to presets (not computed)
                this.chargeSettings.chargeMethod = "presets";
            }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    ionViewDidLoad() {
        this.chargerService.getPresets().subscribe((presetList) => {
            this.presets = presetList;
        });
    }

    chargeUsingPreset(preset: Preset) {
        this.navCtrl.pop().then(() => {
            this.callback(preset);
        })
    }

    chargeUsingPlan() {
        let chargePlanPreset: Preset = this.presets.find((p: Preset) => {
            return p.name == ChargeOptionsPage.CHARGE_BY_PLAN_PRESET_NAME;
        });

        let createNewPreset: boolean = chargePlanPreset == null;

        if (!chargePlanPreset) {
            // Clone the first lipo we can find
            let toClone = this.filterByChemistryAndSort(Preset.chemistryPrefix(ChemistryType.LiPo)).shift();

            // The newly cloned preset will have index == -1.
            // Meaning: it'll be ADDED when saved.
            chargePlanPreset = toClone.clone();
            if (chargePlanPreset.index != -1) {
                this.uiActions.setErrorMessage("Oh oh! New preset doesn't have -1 index");
                return;
            }

            chargePlanPreset.charge_current = this.chargeSettings.safeAmpsForWantedChargeRate;
            chargePlanPreset.name = ChargeOptionsPage.CHARGE_BY_PLAN_PRESET_NAME;
            console.log("No charge plan preset. Creating one for:", chargePlanPreset.charge_current, "amps");
        } else {
            chargePlanPreset.charge_current = this.chargeSettings.safeAmpsForWantedChargeRate;
        }

        this.simpleAlert = this.toastController.create({
            'message': "Setting up preset...",
            'position': 'bottom',
        });
        this.simpleAlert.present();

        let observable;
        if(createNewPreset) {
            observable = this.chargerService.addPreset(chargePlanPreset);
        } else {
            observable = this.chargerService.savePreset(chargePlanPreset);
        }

        observable.subscribe((preset: Preset) => {
            this.simpleAlert.dismiss();

            this.navCtrl.pop().then(() => {
                this.callback(preset);
            })
        }, (error) => {
            this.simpleAlert.dismiss();
            this.uiActions.setErrorMessage(error);
        }, () => {
        });
    }

    get chargeMethod(): string {
        return this.chargeSettings.chargeMethod;
    }

    set chargeMethod(value) {
        this.actions.setChargeConfiguration('chargeMethod', value);
    }

    get chemistryFilter(): string {
        return this.chargeSettings.chemistryFilter;
    }

    set chemistryFilter(value) {
        this.actions.setChargeConfiguration('chemistryFilter', value);
    }

    get capacity() {
        return this.chargeSettings.capacity;
    }

    set capacity(value) {
        this.actions.setChargeConfiguration('capacity', value);
    }

    get chargeRate() {
        return this.chargeSettings.wantedChargeRateInC;
    }

    get chargeRateTimesTen() {
        return this.chargeRate * 10;
    }

    set chargeRateTimesTen(value) {
        this.chargeRate = value / 10.0;
    }

    set chargeRate(value) {
        this.actions.setChargeConfiguration('wantedChargeRateInC', value);
    }

    get numPacks() {
        return this.chargeSettings.numPacks;
    }

    set numPacks(value) {
        this.actions.setChargeConfiguration('numPacks', value);
    }

    showFlame() {
        return this.chargeRate >= 5.0;
    }

    chargePlan() {
        return "Charge at " + sprintf("%2.01fA", this.chargeSettings.safeAmpsForWantedChargeRate);
    }

    filterByChemistryAndSort(chemistry: string) {
        let presets = this.presets.filter((preset) => {
            if (chemistry == Preset.chemistryPrefix(ChemistryType.Anything)) {
                return true;
            }
            return Preset.chemistryPrefix(preset.type) == chemistry;
        });
        presets.sort((a: Preset, b: Preset) => {
            if (a.charge_current < b.charge_current) {
                return -1;
            } else if (a.charge_current > b.charge_current) {
                return 1;
            }
            return 0;
        });
        return presets;
    }

    filteredPresets() {
        let presets = this.filterByChemistryAndSort(this.chemistryFilter);
        return _.chunk(presets, 3);
    }

    ampsLimit() {
        return this.chargerService.getMaxAmpsPerChannel();
    }

    chemistryClass: () => string;
}

applyMixins(ChargeOptionsPage, [Chemistry]);
