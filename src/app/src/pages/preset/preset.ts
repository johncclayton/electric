import {Component} from "@angular/core";
import {AlertController, NavController, NavParams} from "ionic-angular";
import {PresetChargePage} from "../preset-charge/preset-charge";
import {ChemistryType, Preset} from "../../models/preset-class";
import {PresetStoragePage} from "../preset-storage/preset-storage";
import {PresetDischargePage} from "../preset-discharge/preset-discharge";
import {PresetCyclePage} from "../preset-cycle/preset-cycle";
import {iChargerService} from "../../services/icharger.service";
import * as _ from "lodash";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {observable} from "rxjs/symbol/observable";

export interface SavePresetInterface {
    savePreset(whenDoneCall: (preset: Preset) => void): void;
}

@Component({
    selector: 'page-preset',
    templateUrl: 'preset.html'
})
export class PresetPage implements SavePresetInterface {
    preset: Preset = null;
    unmodifiedpreset: Preset = null;
    confirmedExit: boolean = false;
    saving: boolean = false;
    optionsPages;

    private callback: (preset: Preset) => void;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    constructor(public navCtrl: NavController,
                public alertController: AlertController,
                public chargerService: iChargerService,
                public navParams: NavParams) {

        this.callback = navParams.data['callback'];
        this.preset = _.cloneDeep(navParams.data['preset']);
        this.unmodifiedpreset = _.cloneDeep(this.preset);
    }

    optionPagesForCurrentType() {
        if (this.optionsPages == null) {
            this.optionsPages = [
                {title: 'Charging', component: PresetChargePage},
                {title: 'Discharging', component: PresetDischargePage},
                {title: 'Cycle', component: PresetCyclePage},

                // Don't see options in the charger, so dunno what to do here
                // {title: 'Balancing', component: PresetBalancePage},
            ];

            if (this.preset.type == ChemistryType.LiPo ||
                this.preset.type == ChemistryType.LiFe) {
                this.optionsPages.push(
                    {title: 'Storage', component: PresetStoragePage}
                );
            }
        }
        return this.optionsPages;
    }

    get presetType() {
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
        return this.preset.readonly;
    }

    ionViewDidLoad() {
        // This was used for testing, to quickly get to a page I was working on
        // this.switchTo(PresetChargePage);
        // this.switchTo(PresetDischargePage);
        // this.switchTo(PresetStoragePage);
        // this.switchTo(PresetCyclePage);
        this.confirmedExit = false;
    }

    ionViewCanLeave() {
        return new Promise((resolve, reject) => {
            // If there are changes, we should prompt the user to save.
            let presetBeingEdited = this.preset;
            let modifiedProperties = _.reduce(this.unmodifiedpreset.data, function (result, value, key) {
                return _.isEqual(value, presetBeingEdited.data[key]) ?
                    result : result.concat(key);
            }, []);

            // let are_equal = _.isEqual(this.unmodifiedpreset.data, this.preset.data);
            let are_equal = modifiedProperties.length == 0;
            if (!are_equal) {
                console.log("Preset modified:");
                for (let property of modifiedProperties) {
                    console.log(property, ": ", this.unmodifiedpreset.data[property], " (", typeof(this.unmodifiedpreset.data[property]),
                        ") now = ", presetBeingEdited.data[property], "(", typeof(presetBeingEdited.data[property]), ")");
                }
                this.confirmedExit = false;
                let alert = this.alertController.create({
                    title: 'Preset modified',
                    message: 'Do you want to save your changes?',
                    buttons: [
                        {
                            text: 'Save',
                            handler: () => {
                                this.savePreset((preset) => {
                                    // Pass the result back to the caller.
                                    this.callback(preset);
                                    resolve();
                                });
                            }
                        },
                        {
                            text: 'Discard',
                            handler: () => {
                                this.saving = false;
                                resolve();
                            }
                        },
                        {
                            text: 'Cancel',
                            handler: () => {
                                this.saving = false;
                                reject();
                            }
                        }
                    ]
                });
                alert.present();
            } else {
                resolve();
            }
        });
    }

    // If there's an error, the charger service will fire an event.
    // It'll be picked up by the charger-status component, and an error shown as a toast
    savePreset(whenDoneCall: (preset: Preset) => void): void {
        this.saving = true;
        this.chargerService.savePreset(this.preset)
            .takeUntil(this.ngUnsubscribe)
            .subscribe((preset) => {
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
            .takeUntil(this.ngUnsubscribe)
            .subscribe((presetList) => {
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
        let choices = [];
        choices.push({'value': 0, 'text': 'Auto'});
        for (let i = 0; i < this.chargerService.getNumberOfChannels(); i++) {
            choices.push({'value': i + 1, 'text': (i + 1).toString()});
        }
        return choices;
    }

    currentChoices() {
        let choices = [{value: 0.25, text: "0.25A"}, {value: 0.5, text: "0.5A"}];
        for (let i = 10; i <= this.chargerService.getMaxAmpsPerChannel() * 10; i++) {
            let real = i / 10;
            choices.push({'value': real, 'text': (real).toString() + "A"});
        }
        return choices;
    }

    switchTo(page) {
        this.navCtrl.push(page, {
            preset: this.preset,
            saver: this
        });
    }
}

