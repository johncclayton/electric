import {AfterContentInit, ApplicationRef, ChangeDetectionStrategy, Component, NgZone, OnInit} from '@angular/core';
import {Chemistry} from '../../utils/mixins';
import {applyMixins} from 'rxjs/internal-compatibility';
import {chargerSettingsDefaults, IChargeSettings, IConfig} from '../../models/state/reducers/configuration';
import {IUIState} from '../../models/state/reducers/ui';
import {Channel} from '../../models/channel';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {NavController, ToastController} from '@ionic/angular';
import {iChargerService} from '../../services/icharger.service';
import {UIActions} from '../../models/state/actions/ui';
import {NgRedux, select} from '@angular-redux/store';
import {IAppState} from '../../models/state/configure';
import {DataBagService} from '../../services/data-bag.service';
import {take, takeUntil} from 'rxjs/operators';
import {ChemistryType, Preset} from '../../models/preset-class';
import {sprintf} from 'sprintf-js';
import * as _ from 'lodash';
import {ConfigurationActions} from '../../models/state/actions/configuration';

@Component({
    selector: 'app-charge-options',
    templateUrl: './charge-options.page.html',
    styleUrls: ['./charge-options.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChargeOptionsPage implements OnInit, AfterContentInit, Chemistry {
    private previousURL: string;

    filteredPresets$: Subject<Array<Preset>>;
    @select() config$: Observable<IConfig>;
    @select() ui$: Observable<IUIState>;
    @select(['config', 'charge_settings']) charge_settings$: Observable<IConfig>;

    channel: Channel;
    title: string = 'Charge';
    showCapacityAndC: boolean = true;
    charging: boolean = true;
    _presets: Array<any> = [];

    private callback: any;
    private simpleAlert: any;

    public static CHARGE_BY_PLAN_PRESET_NAME: string = 'Electric Charge Plan';

    private chargeSettings: IChargeSettings;
    private config: IConfig;
    private ui: IUIState;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public navCtrl: NavController,
                public chargerService: iChargerService,
                public uiActions: UIActions,
                public zone: NgZone,
                public appRef: ApplicationRef,
                public configActions: ConfigurationActions,
                public dataBag: DataBagService,
                public toastController: ToastController,
                public ngRedux: NgRedux<IAppState>) {

        this.filteredPresets$ = new BehaviorSubject<Array<Preset>>([]);

        const options = this.dataBag.get('chargingOptions');
        if (!options) {
            setTimeout(() => {
                this.navCtrl.navigateRoot('');
            }, 500);
            return;
        }

        this.channel = options['channel'];
        this.showCapacityAndC = options['showCapacityAndC'];
        this.charging = options['charging'];
        this.title = options['title'];
        this.callback = options['callback'];
        this.config = null;
        this.previousURL = options['previousURL'];
        this.chargeSettings = null;
    }

    ngOnInit() {
        this.ngRedux.select<IConfig>('config')
            .pipe(
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe(c => {
                this.zone.run(() => {
                    this.config = c;
                    this.chargeSettings = this.config.charge_settings;
                    if (this.chargeSettings == null || this.chargeSettings === undefined) {
                        console.log(`No charger settings, reset to defaults`);
                        this.configActions.resetChargeSettingsToDefaults();
                    } else {
                        console.warn(`Setup charge settings to: ${JSON.stringify(this.chargeSettings)}`);
                    }
                    if (!this.showCapacityAndC) {
                        // Force to presets (not computed)
                        this.chargeMethod = 'presets';
                    }
                });
            });
    }

    ngAfterContentInit() {
        this.chargerService.getPresets()
            .pipe(
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((presetList) => {
                this.zone.run(() => {
                    if(presetList) {
                        this.presets = presetList;
                    } else {
                        console.warn(`Got 'next' for loading preses, but list was null?`);
                    }
                });
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    chargeUsingPreset(preset: Preset) {
        this.closePage(preset);
    }

    closePage(passObject) {
        this.navCtrl.navigateBack(this.previousURL).then(() => {
            this.callback(passObject);
        });
    }

    async chargeUsingPlan() {
        let chargePlanPreset: Preset = this._presets.find((p: Preset) => {
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
                this.uiActions.setErrorMessage('Oh oh! New preset doesn\'t have -1 index');
                return;
            }

            chargePlanPreset.charge_current = this.chargeSettings.safeAmpsForWantedChargeRate;
            chargePlanPreset.name = ChargeOptionsPage.CHARGE_BY_PLAN_PRESET_NAME;
            console.log('No charge plan preset. Creating one for:', chargePlanPreset.charge_current, 'amps');
        } else {
            chargePlanPreset.charge_current = this.chargeSettings.safeAmpsForWantedChargeRate;
        }

        this.simpleAlert = await this.toastController.create({
            'message': 'Setting up preset...',
            'position': 'bottom',
        });
        await this.simpleAlert.present();

        let observable;
        if (createNewPreset) {
            observable = this.chargerService.addPreset(chargePlanPreset);
        } else {
            observable = this.chargerService.savePreset(chargePlanPreset);
        }

        observable
            .pipe(
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((preset: Preset) => {
                this.simpleAlert.dismiss().then(() => {
                    this.closePage(preset);
                });
            }, (error) => {
                this.simpleAlert.dismiss().then(() => {
                    this.uiActions.setErrorMessage(error);
                });
            });
    }

    get chargeMethod(): string {
        if (this.chargeSettings !== undefined && this.chargeSettings !== null) {
            return this.chargeSettings.chargeMethod;
        }
        return '';
    }

    set chargeMethod(value) {
        if (this.chargeMethod != value) {
            this.chargerService.setChargeConfiguration('chargeMethod', value);
        }
    }

    get chemistryFilter(): string {
        return this.chargeSettings.chemistryFilter;
    }

    set chemistryFilter(value) {
        this.chargerService.setChargeConfiguration('chemistryFilter', value);
        this.emitNewFilteredPresets();
    }

    get capacity() {
        return this.chargeSettings.capacity;
    }

    set capacity(value) {
        this.chargerService.setChargeConfiguration('capacity', value);
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
        this.chargerService.setChargeConfiguration('wantedChargeRateInC', value);
    }

    get numPacks() {
        return this.chargeSettings.numPacks;
    }

    set numPacks(value) {
        this.chargerService.setChargeConfiguration('numPacks', value);
    }

    showFlame() {
        return this.chargeRate >= 5.0;
    }

    chargePlan() {
        return 'Charge at ' + sprintf('%2.01fA', this.chargeSettings.safeAmpsForWantedChargeRate);
    }

    set presets(list: any) {
        if(Array.isArray(list)) {
            this._presets = list;
            this.emitNewFilteredPresets();
            console.info(`Loaded the preset list... (${this._presets.length} items)`);
        } else {
            console.warn(`Got a ${list.constructor.name} for presets, expected a list`);
            this.filteredPresets$.next([]);
        }
    }

    private emitNewFilteredPresets() {
        this.filteredPresets$.next(this.filteredPresets());
    }

    private filterByChemistryAndSort(chemistry: string) {
        let presets = this._presets.filter((preset) => {
            // Ignore the specific IR measurement preset
            if (preset.name == iChargerService.irMeasurementPresetName) {
                return false;
            }
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

    private filteredPresets() {
        // console.log(`Filter presets by this: ${this.chemistryFilter}`);
        let presets = this.filterByChemistryAndSort(this.chemistryFilter);
        return _.chunk(presets, 3);
    }

    // noinspection JSMethodCanBeStatic
    ampsLimit() {
        return iChargerService.getMaxAmpsPerChannel();
    }

    chemistryClass: () => string;
}

applyMixins(ChargeOptionsPage, [Chemistry]);
