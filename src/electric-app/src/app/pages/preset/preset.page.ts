import {
    AfterContentInit,
    AfterViewInit,
    ApplicationRef,
    ChangeDetectionStrategy,
    Component,
    NgZone,
    OnInit,
    ViewChild
} from '@angular/core';
import {ChemistryType, Preset} from '../../models/preset-class';
import {Observable, Subject} from 'rxjs';
import {AlertController, NavController} from '@ionic/angular';
import {iChargerService} from '../../services/icharger.service';
import {DataBagService} from '../../services/data-bag.service';
import * as _ from 'lodash';
import {ICanDeactivate} from '../../services/can-deactivate-preset-guard.service';
import {takeUntil} from 'rxjs/operators';
import {NgRedux, select} from '@angular-redux/store';
import {IUIState} from '../../models/state/reducers/ui';
import {IAppState} from '../../models/state/configure';
import {UIActions} from '../../models/state/actions/ui';
import {ToastHelper} from '../../utils/messaging';
import {CustomNGXLoggerService, NGXLogger, NgxLoggerLevel} from 'ngx-logger';
import {NgForm} from '@angular/forms';

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
export class PresetPage implements OnInit, ICanDeactivate, AfterContentInit, AfterViewInit, SavePresetInterface {
    preset: Preset;
    unmodifiedpreset: Preset;
    confirmedExit: boolean = false;

    @select() ui$: Observable<IUIState>;

    private __currentChoices;
    private __cellChoices;
    private __optionsPages;

    private callback: (preset: Preset) => void;

    private ngUnsubscribe: Subject<void> = new Subject<void>();
    private logger: NGXLogger;

    @ViewChild(NgForm) ngForm;

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
                private logSvc: CustomNGXLoggerService,
                private messaging: ToastHelper) {

        this.logger = logSvc.create({level: NgxLoggerLevel.INFO});
        const navParams = this.dataBag.get('preset');
        if (navParams === undefined) {
            this.navCtrl.navigateBack('PresetList');
        } else {
            if (navParams['preset'] === undefined) {
                this.navCtrl.navigateBack('PresetList');
                return;
            }
            this.callback = navParams['callback'];
            this.copyPresetToSelf(navParams['preset']);

            if (this.preset === undefined || this.preset === null) {
                this.navCtrl.navigateBack('PresetList');
                return;
            }
        }
    }

    get canSubmit(): boolean {
        if (this.ngForm) {
            let formGroup = this.ngForm.form;
            // this.logger.info(`Form is a ${this.ngForm.constructor.name}. Valid: ${formGroup.valid}`);
            return formGroup.valid;
        // } else {
        //     this.logger.warn(`No form, can't decide`);
        }
        return true;
    }


    copyPresetToSelf(preset: Preset) {
        this.preset = _.cloneDeep(preset);
        this.unmodifiedpreset = _.cloneDeep(preset);
    }

    ngOnInit() {
        this.confirmedExit = false;

        this.__cellChoices = [];
        this.__cellChoices.push({'value': 0, 'text': 'Auto'});
        for (let i = 0; i < iChargerService.getMaxCells(); i++) {
            this.__cellChoices.push({'value': i + 1, 'text': (i + 1).toString()});
        }

        this.__currentChoices = [{value: 0.25, text: '0.25A'}, {value: 0.5, text: '0.5A'}];
        let maxChargeChoice = _.clamp(iChargerService.getMaxAmpsPerChannel() * 10, 10, 400);
        for (let i = 10; i <= maxChargeChoice; i += 5) {
            let real = i / 10;
            this.__currentChoices.push({'value': real, 'text': (real).toString() + 'A'});
        }
    }

    ngAfterViewInit() {
        // this.logger.info('ngAfterViewInit');
        // this.canSubmit;
    }

    ngAfterContentInit() {
        // This was used for testing, to quickly get to a page I was working on
        if (0) {
            if (this.preset) {
                // this.logger.info(`Selected preset: ${JSON.stringify(this.preset)}`);
                setTimeout(() => {
                    // this.goToSubpage('PresetCharge');
                    // this.goToSubpage('PresetDischarge');
                    // this.goToSubpage('PresetStorage');
                    // this.goToSubpage('PresetCycle');
                }, 500);
            }
        }
        if (this.preset == null) {
            setTimeout(() => {
                this.logger.warn(`No preset, navigating back to the root`);
                this.navCtrl.navigateRoot('');
            }, 500);
        }
    }

    private derivePresetPages() {
        if (this.preset === undefined) {
            this.__optionsPages = [];
            this.logger.warn(`Preset is undefined. Odd. So... no options for you!`);
            return;
        }
        // this.logger.log(`Deriving preset options for type: ${this.preset.type}`);
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
            this.logger.log('Preset not set. Returning chemistry type "Anything"');
            return ChemistryType.Anything;
        }
        // this.logger.log(`Preset has chemistry: ${this.preset.type}`);
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

    guardOnlyTheseURLs(): Array<string> | null {
        return ['/PresetList'];
    }

    get modifiedPresetProperties(): Array<string> {
        // If there are changes, we should prompt the user to save.
        this.logger.log(`${this.constructor.name} is checking to see if the preset has changed...`);
        let presetBeingEdited = this.preset;
        return _.reduce(this.unmodifiedpreset.data, function (result, value, key) {
            // this.logger.log(`checking key ${key}. Does ${value} != ${presetBeingEdited.data[key]} ? `);
            return _.isEqual(value, presetBeingEdited.data[key]) ?
                result : result.concat(key);
        }, []);
    }

    canDeactivate(): Observable<boolean> {
        return Observable.create(obs => {
            if (!this.preset) {
                this.logger.warn(`CanDeactivate for ${this.constructor.name} has no preset, returning true`);
                obs.next(true);
                obs.complete();
                return;
            }
            // If there are changes, we should prompt the user to save.
            let modifiedProperties = this.modifiedPresetProperties;
            // let are_equal = _.isEqual(this.unmodifiedpreset.data, this.preset.data);
            let are_equal = modifiedProperties.length == 0;
            if (!are_equal) {
                this.logger.log(`Preset ${this.preset.name} is modified:`);
                for (let property of modifiedProperties) {
                    this.logger.log(property, ': ', this.unmodifiedpreset.data[property], ' (', typeof(this.unmodifiedpreset.data[property]),
                        ') now = ', this.preset.data[property], '(', typeof(this.preset.data[property]), ')');
                }
                this.confirmedExit = false;
                this.alertController.create({
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
                this.logger.log(`Preset ${this.preset.name} has no changes, fine to deactivate`);
                obs.next(true);
                obs.complete();
            }

        });
    }

    // If there's an error, the charger service will fire an event.
    // It'll be picked up by the charger-status component, and an error shown as a toast
    savePreset(whenDoneCall: (preset: Preset) => void = null): void {
        this.uiActions.setIsSaving();
        this.chargerService.savePreset(this.preset)
            .pipe(
                takeUntil(this.ngUnsubscribe)
            ).subscribe((preset) => {
                // Because the chargerService runs and notifies us OUTSIDE of ng
                this.zone.run(() => {
                    // When you save,  you are always given your preset back.
                    this.copyPresetToSelf(preset);
                });
            },
            (error) => {
                this.zone.run(() => {
                    this.logger.error(`Error saving preset: ${error}`);
                    this.uiActions.setErrorFromErrorObject(`Error during save`, error);
                    this.uiActions.setIsNotSaving();
                });
            }, () => {
                this.zone.run(() => {
                    this.logger.log(`Finished saving preset ${this.preset.name}`);
                    this.messaging.showMessage(`Saved ${this.preset.name}`);
                    this.uiActions.setIsNotSaving();
                    this.callback(this.preset);
                    if (whenDoneCall) {
                        whenDoneCall(this.preset);
                    }
                });
            });
    }

    refreshPreset(event) {
        // This gets the preset from the charger, overwrites local state and also updates the PresetList
        let refreshFunc = () => {
            this.chargerService.getPresets()
                .pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe((presetList) => {
                this.zone.run(() => {
                    let wantedPreset = presetList[this.preset.index];
                    if (wantedPreset) {
                        this.copyPresetToSelf(wantedPreset);
                        this.callback(this.preset);
                        this.messaging.showMessage('Preset refreshed');
                    }
                    event.target.complete();
                });
            });
        };

        // Unsaved changes? Prompt the user first.
        let modifiedProperties = this.modifiedPresetProperties;
        if (modifiedProperties.length > 0) {
            this.alertController.create({
                header: 'Preset modified',
                subHeader: 'Refreshing will discard any changes. Sure?',
                buttons: [
                    {
                        text: 'Yes',
                        handler: refreshFunc
                    },
                    {
                        text: 'No',
                        handler: () => {
                            event.target.complete();
                        }
                    }
                ]
            }).then(alert => {
                alert.present();
            });
        } else {
            refreshFunc();
        }
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

    goToSubpage(pageName: string) {
        this.dataBag.set('preset-saver', this);
        this.navCtrl.navigateForward(pageName);
    }
}
