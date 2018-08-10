import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ChemistryType, Preset} from '../../models/preset-class';
import {Observable, Subject} from 'rxjs';
import {AlertController, NavController} from '@ionic/angular';
import {iChargerService} from '../../services/icharger.service';
import {DataBagService} from '../../services/data-bag.service';
import * as _ from 'lodash';
import {ICanDeactivate} from '../../services/can-deactivate-guard.service';
import {takeUntil} from 'rxjs/operators';

@Component({
    selector: 'app-preset',
    templateUrl: './preset.page.html',
    styleUrls: ['./preset.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresetPage implements OnInit, ICanDeactivate {
    preset: Preset;
    unmodifiedpreset: Preset;
    confirmedExit: boolean = false;
    saving: boolean = false;
    optionsPages;

    private __currentChoices;
    private __cellChoices;

    private callback: (preset: Preset) => void;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    constructor(public navCtrl: NavController,
                public alertController: AlertController,
                public chargerService: iChargerService,
                public dataBag: DataBagService) {


        const navParams = this.dataBag.get('preset');
        if (navParams === undefined) {
            this.navCtrl.goBack('PresetList');
            return;
        } else {
            if (navParams['preset'] === undefined) {
                this.navCtrl.goBack('PresetList');
                return;
            }
            this.callback = navParams['callback'];
            this.preset = _.cloneDeep(navParams['preset']);
            this.unmodifiedpreset = _.cloneDeep(this.preset);
        }
    }

    ngOnInit() {

        // This was used for testing, to quickly get to a page I was working on
        // this.switchTo(PresetChargePage);
        // this.switchTo(PresetDischargePage);
        // this.switchTo(PresetStoragePage);
        // this.switchTo(PresetCyclePage);

        this.confirmedExit = false;
    }

    optionPagesForCurrentType() {
        if (this.optionsPages == null) {
            this.optionsPages = [
                {title: 'Charging', url: 'PresetCharge'},
                {title: 'Discharging', url: 'PresetDischarge'},
                {title: 'Cycle', url: 'PresetCycle'},

                // Don't see options in the charger, so dunno what to do here
                // {title: 'Balancing', component: PresetBalancePage},
            ];

            if (this.preset.type == ChemistryType.LiPo ||
                this.preset.type == ChemistryType.LiFe) {
                this.optionsPages.push(
                    {title: 'Storage', url: 'PresetStorage'}
                );
            }
        }
        return this.optionsPages;
    }

    get presetType() {
        if (this.preset === undefined) {
            return ChemistryType.Anything;
        }
        return this.preset.type;
    }

    set presetType(newType) {
        this.optionsPages = null;
        this.preset.type = newType;
    }

    isDisabled() {
        return this.saving;
    }

    isReadOnly() {
        if (this.preset === undefined) {
            return true;
        }
        return this.preset.readonly;
    }

    canDeactivate(): Observable<boolean> {
        return Observable.create(obs => {
            // If there are changes, we should prompt the user to save.
            let presetBeingEdited = this.preset;
            let modifiedProperties = _.reduce(this.unmodifiedpreset.data, function (result, value, key) {
                return _.isEqual(value, presetBeingEdited.data[key]) ?
                    result : result.concat(key);
            }, []);

            // let are_equal = _.isEqual(this.unmodifiedpreset.data, this.preset.data);
            let are_equal = modifiedProperties.length == 0;
            if (!are_equal) {
                console.log('Preset modified:');
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
                                this.saving = false;
                                obs.next(true);
                                obs.complete();
                            }
                        },
                        {
                            text: 'Cancel',
                            handler: () => {
                                this.saving = false;
                                obs.next(false);
                                obs.complete();
                            }
                        }
                    ]
                }).then(alert => {
                    alert.present();
                });
            } else {
                obs.next(true);
                obs.complete();
            }

        });
    }

    // If there's an error, the charger service will fire an event.
    // It'll be picked up by the charger-status component, and an error shown as a toast
    savePreset(whenDoneCall: (preset: Preset) => void): void {
        this.saving = true;
        this.chargerService.savePreset(this.preset)
            .pipe(
                takeUntil(this.ngUnsubscribe)
            ).subscribe((preset) => {
            // When you save,  you are always given your preset back.
            this.unmodifiedpreset = _.cloneDeep(preset);
            this.saving = false;
            if (whenDoneCall) {
                whenDoneCall(preset);
            }
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
        if (this.__cellChoices == null) {
            this.__cellChoices = [];
            this.__cellChoices.push({'value': 0, 'text': 'Auto'});
            for (let i = 0; i < this.chargerService.getNumberOfChannels(); i++) {
                this.__cellChoices.push({'value': i + 1, 'text': (i + 1).toString()});
            }
        }
        return this.__cellChoices;
    }

    currentChoices() {
        if (this.__cellChoices === undefined) {
            this.__currentChoices = [{value: 0.25, text: '0.25A'}, {value: 0.5, text: '0.5A'}];
            let maxChargeChoice = _.clamp(iChargerService.getMaxAmpsPerChannel() * 10, 10, 400);
            for (let i = 10; i <= maxChargeChoice; i += 5) {
                let real = i / 10;
                this.__currentChoices.push({'value': real, 'text': (real).toString() + 'A'});
            }
        }
        return this.__currentChoices;
    }

    get ourAlertOptions() {
        return {
            'header': 'Select Current'
        }
    }
}
