import {AfterContentInit, ApplicationRef, ChangeDetectionStrategy, Component, NgZone, OnInit} from '@angular/core';
import {ChemistryType, Preset} from '../../models/preset-class';
import {Observable, Subject} from 'rxjs';
import {AlertController, NavController, ToastController} from '@ionic/angular';
import {iChargerService} from '../../services/icharger.service';
import {DataBagService} from '../../services/data-bag.service';
import * as _ from 'lodash';
import {ICanDeactivate} from '../../services/can-deactivate-guard.service';
import {takeUntil} from 'rxjs/operators';
import {NgRedux, select} from '@angular-redux/store';
import {IUIState} from '../../models/state/reducers/ui';
import {IAppState} from '../../models/state/configure';
import {UIActions} from '../../models/state/actions/ui';
import {ToastHelper} from '../../utils/messaging';

export interface SavePresetInterface {
    savePreset(whenDoneCall: (preset: Preset) => void): void;

    canDeactivate(): Observable<boolean>;

    getPreset(): Preset;
}

@Component({
    selector: 'app-preset',
    templateUrl: './preset.page.html',
    styleUrls: ['./preset.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresetPage implements OnInit, ICanDeactivate, AfterContentInit, SavePresetInterface {
    preset: Preset;
    unmodifiedpreset: Preset;
    confirmedExit: boolean = false;

    @select() ui$: Observable<IUIState>;

    private __currentChoices;
    private __cellChoices;
    private __optionsPages;

    private callback: (preset: Preset) => void;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    constructor(public navCtrl: NavController,
                public alertController: AlertController,
                public appRef: ApplicationRef,
                public uiActions: UIActions,
                public ngRedux: NgRedux<IAppState>,
                public zone: NgZone,
                public chargerService: iChargerService,
                public dataBag: DataBagService,
                private messaging: ToastHelper) {

        const navParams = this.dataBag.get('preset');
        if (navParams === undefined) {
            this.navCtrl.navigateBack('PresetList');
        } else {
            if (navParams['preset'] === undefined) {
                this.navCtrl.navigateBack('PresetList');
                return;
            }
            this.callback = navParams['callback'];
            this.preset = _.cloneDeep(navParams['preset']);
            this.unmodifiedpreset = _.cloneDeep(this.preset);

            if (this.preset === undefined || this.preset === null) {
                this.navCtrl.navigateBack('PresetList');
                return;
            }
        }
    }

    ngOnInit() {
        this.confirmedExit = false;

        this.__cellChoices = [];
        this.__cellChoices.push({'value': 0, 'text': 'Auto'});
        for (let i = 0; i < this.chargerService.getNumberOfChannels(); i++) {
            this.__cellChoices.push({'value': i + 1, 'text': (i + 1).toString()});
        }

        this.__currentChoices = [{value: 0.25, text: '0.25A'}, {value: 0.5, text: '0.5A'}];
        let maxChargeChoice = _.clamp(iChargerService.getMaxAmpsPerChannel() * 10, 10, 400);
        for (let i = 10; i <= maxChargeChoice; i += 5) {
            let real = i / 10;
            this.__currentChoices.push({'value': real, 'text': (real).toString() + 'A'});
        }
        // This was used for testing, to quickly get to a page I was working on

        // this.goToSubpage('PresetCharge');
        // this.goToSubpage('PresetDischarge');
        // this.goToSubpage('PresetStorage');
        // this.goToSubpage('PresetCycle');

        if (this.preset) {
            // console.info(`Selected preset: ${JSON.stringify(this.preset)}`);
        }
    }

    ngAfterContentInit() {
    }

    private derivePresetPages() {
        if (this.preset === undefined) {
            this.__optionsPages = [];
            console.warn(`Preset is undefined. Odd. So... no options for you!`);
            return;
        }
        // console.log(`Deriving preset options for type: ${this.preset.type}`);
        this.__optionsPages = [
            {title: 'Charging', url: 'PresetCharge'},
            {title: 'Discharging', url: 'PresetDischarge'},
            {title: 'Cycle', url: 'PresetCycle'},

            // Don't see options in the charger, so dunno what to do here
            // {title: 'Balancing', component: PresetBalancePage},
        ];

        if (this.preset.type == ChemistryType.LiPo ||
            this.preset.type == ChemistryType.LiFe) {
            this.__optionsPages.push(
                {title: 'Storage', url: 'PresetStorage'}
            );
        }
    }

    get optionPagesForCurrentType() {
        if (this.__optionsPages === undefined || this.__optionsPages == null) {
            this.derivePresetPages();
        }
        return this.__optionsPages || [];
    }

    get presetType() {
        if (this.preset === undefined) {
            console.log('Preset not set. Returning chemistry type "Anything"');
            return ChemistryType.Anything;
        }
        // console.log(`Preset has chemistry: ${this.preset.type}`);
        return this.preset.type;
    }

    set presetType(newType) {
        if (newType === undefined) {
            return;
        }
        this.__optionsPages = null;
        this.preset.type = newType;
        this.derivePresetPages();
        this.appRef.tick();
    }

    isDisabled() {
        return this.ngRedux.getState().ui.isSaving;
    }

    isReadOnly() {
        if (this.preset === undefined) {
            return true;
        }
        return this.preset.readonly;
    }

    getPreset() {
        return this.preset;
    }

    canDeactivate(): Observable<boolean> {
        return Observable.create(obs => {
            if (!this.preset) {
                console.warn(`CanDeactivate for ${this.constructor.name} has no preset, returning true`);
                obs.next(true);
                obs.complete();
                return;
            }
            // If there are changes, we should prompt the user to save.
            console.log(`${this.constructor.name} is checking to see if the preset has changed...`);
            let presetBeingEdited = this.preset;
            let modifiedProperties = _.reduce(this.unmodifiedpreset.data, function (result, value, key) {
                // console.log(`checking key ${key}. Does ${value} != ${presetBeingEdited.data[key]} ? `);
                return _.isEqual(value, presetBeingEdited.data[key]) ?
                    result : result.concat(key);
            }, []);

            // let are_equal = _.isEqual(this.unmodifiedpreset.data, this.preset.data);
            let are_equal = modifiedProperties.length == 0;
            if (!are_equal) {
                console.log(`Preset ${this.preset.name} is modified:`);
                for (let property of modifiedProperties) {
                    console.log(property, ': ', this.unmodifiedpreset.data[property], ' (', typeof(this.unmodifiedpreset.data[property]),
                        ') now = ', presetBeingEdited.data[property], '(', typeof(presetBeingEdited.data[property]), ')');
                }
                this.confirmedExit = false;
                let alert = this.alertController.create({
                    header: 'Preset modified',
                    subHeader: 'Do you want to save your changes?',
                    buttons: [
                        {
                            text: 'Save',
                            handler: () => {
                                this.savePreset((preset) => {
                                    this.appRef.tick();
                                    // Pass the result back to the caller.
                                    this.callback(preset);
                                    obs.next(true);
                                    obs.complete();
                                });
                            }
                        },
                        {
                            text: 'Discard',
                            handler: () => {
                                this.uiActions.setIsNotSaving();
                                obs.next(true);
                                obs.complete();
                            }
                        },
                        {
                            text: 'Cancel',
                            handler: () => {
                                this.uiActions.setIsNotSaving();
                                obs.next(false);
                                obs.complete();
                            }
                        }
                    ]
                }).then(alert => {
                    alert.present();
                });
            } else {
                console.log(`Preset ${this.preset.name} has no changes, fine to deactivate`);
                obs.next(true);
                obs.complete();
            }

        });
    }

    // If there's an error, the charger service will fire an event.
    // It'll be picked up by the charger-status component, and an error shown as a toast
    savePreset(whenDoneCall: (preset: Preset) => void): void {
        this.uiActions.setIsSaving();
        this.chargerService.savePreset(this.preset)
            .pipe(
                takeUntil(this.ngUnsubscribe)
            ).subscribe((preset) => {
                // Because the chargerService runs and notifies us OUTSIDE of ng
                this.zone.run(() => {
                    // When you save,  you are always given your preset back.
                    this.preset = _.cloneDeep(preset);
                    this.unmodifiedpreset = _.cloneDeep(preset);
                });
            },
            (error) => {
                this.zone.run(() => {
                    console.error(`Error saving preset: ${error}`);
                    this.messaging.showMessage(error.toString(), true);
                    this.uiActions.setIsNotSaving();
                });
            }, () => {
                this.zone.run(() => {
                    console.log(`Finished saving preset ${this.preset.name}`);
                    this.messaging.showMessage(`Saved ${this.preset.name}`);
                    this.uiActions.setIsNotSaving();
                    this.callback(this.preset);
                    if (whenDoneCall) {
                        whenDoneCall(this.preset);
                    }
                });
            });
    }

    refreshPreset(refresher) {
        // TODO: what if there are unsaved changes?
        // TODO: Causes a bug where the preset list itself isnt refreshed
        this.chargerService.getPresets()
            .pipe(
                takeUntil(this.ngUnsubscribe)
            ).subscribe((presetList) => {
            let wantedPreset = presetList[this.preset.index];
            if (wantedPreset) {
                this.preset = wantedPreset;
            }
            refresher.complete();
        });
    }

    showCells() {
        return this.preset.type == ChemistryType.LiPo ||
            this.preset.type == ChemistryType.LiFe;
    }

    typeChoices() {
        return [
            {'value': ChemistryType.LiPo, 'text': 'LiPo'},
            {'value': ChemistryType.LiLo, 'text': 'LiLo'},
            {'value': ChemistryType.LiFe, 'text': 'LiFe'},
            {'value': ChemistryType.NiMH, 'text': 'NiMH'},
            {'value': ChemistryType.NiCd, 'text': 'NiCd'},
            {'value': ChemistryType.Pb, 'text': 'Pb'},
            {'value': ChemistryType.NiZn, 'text': 'NiZn'},
        ];
    }

    cellChoices() {
        return this.__cellChoices;
    }

    currentChoices() {
        return this.__currentChoices;
    }

    get ourAlertOptions() {
        return {
            'header': 'Select Current'
        };
    }

    toggleSaving() {
        if (this.ngRedux.getState().ui.isSaving) {
            this.uiActions.setIsNotSaving();
        } else {
            this.uiActions.setIsSaving();
        }
    }

    goToSubpage(page) {
        this.dataBag.set('preset-saver', this);
        this.navCtrl.navigateForward(page.url);
    }
}
