import {AfterContentInit, AfterViewInit, Component, OnDestroy, ViewChild} from '@angular/core';
import {ChemistryType, Preset} from '../../models/preset-class';
import {IonList, NavController, IonRefresher, ToastController} from '@ionic/angular';
import {Subject} from 'rxjs';
import {iChargerService} from '../../services/icharger.service';
import {takeUntil} from 'rxjs/operators';
import {DataBagService} from '../../services/data-bag.service';
import {applyMixins} from 'rxjs/internal-compatibility';
import {Chemistry} from '../../utils/mixins';
import {CustomNGXLoggerService, NGXLogger, NgxLoggerLevel} from 'ngx-logger';

@Component({
    selector: 'app-preset-list',
    templateUrl: './preset-list.page.html',
    styleUrls: ['./preset-list.page.scss'],
})
export class PresetListPage implements OnDestroy, AfterContentInit {
    failedToGetPresets: boolean = false;
    loadingPresets: boolean = true;
    public presets: Array<Preset>;
    @ViewChild(IonList) list: IonList;
    @ViewChild(IonRefresher) refresher: IonRefresher;

    private ngUnsubscribe: Subject<void> = new Subject<void>();
    private logger: NGXLogger;

    constructor(public navCtrl: NavController,
                private dataBag: DataBagService,
                public chargerService: iChargerService,
                private logSvc: CustomNGXLoggerService,
                public toastController: ToastController) {
        this.logger = logSvc.create({level: NgxLoggerLevel.INFO});
    }

    ngAfterContentInit() {
        if (this.chargerService) {
            if (!this.chargerService.isConnectedToCharger()) {
                this.logger.error(`Not connected to charger, so going back`);
                setTimeout(() => {
                    this.navCtrl.navigateBack(['']);
                }, 500);
                return;
            }
        }

        this.refreshPresets();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    refreshPresets() {
        this.loadingPresets = true;
        this.failedToGetPresets = false;
        this.chargerService.getPresets(5)
            .pipe(
                takeUntil(this.ngUnsubscribe),
            )
            .subscribe(presetsList => {
                // this.logger.warn(`Received presets: ${presetsList}`);
                this.presets = presetsList;
                this.finishedGettingPresets();

                /*
                 * Was used during testing, to move to a known preset and edit it.
                 */
                const debugPresets = false;
                if (debugPresets) {
                    if (this.presets.length) {
                        // 9 a Lipo of some kind
                        // 3 NiMH
                        const old_preset = this.presets[3];
                        this.setPresetAndCallback(old_preset);
                        this.navCtrl.navigateForward('Preset');
                    }
                }
            }, (err) => {
                this.logger.error(`Error getting presets: ${err}`);
                this.finishedGettingPresets(true);
            }, () => {
            });
    }

    private finishedGettingPresets(failed: boolean = false) {
        this.loadingPresets = false;
        this.failedToGetPresets = failed;
        if (this.refresher) {
            this.refresher.complete();
        }
    }

    async addPreset() {
        let toast = await this.toastController.create({
            message: 'Yep. Sometime soon',
            duration: 2000,
            // dismissOnPageChange: true, // causes an exception. meh.
            position: 'top'
        });

        toast.present();
    }

    setPresetAndCallback(preset) {
        this.dataBag.set('preset', {
            preset: preset,
            callback: (newPreset) => {
                this.presetCallback(preset, newPreset);
            }
        });
    }

    presetCallback(old_preset, new_preset) {
        if (new_preset) {
            this.logger.log(`Got result ${new_preset} from the save call`);
            old_preset.updateFrom(new_preset);
        }
    }

    async editPreset(preset) {
        if (preset) {
            this.logger.log('Editing preset type: ', preset.type, 'usage: ', preset.data.use_flag);
            if (preset.type === ChemistryType.LiPo ||
                preset.type === ChemistryType.NiMH ||
                preset.type === ChemistryType.LiFe) {

                this.setPresetAndCallback(preset);
                this.navCtrl.navigateForward('Preset');
            } else {
                const toast = await this.toastController.create({
                    message: 'Only support editing Lipo/NiMH/LiFe for now',
                    duration: 2000,
                    // dismissOnPageChange: true, // causes an exception. meh.
                    position: 'top'
                });
                toast.present();
            }
        } else {
            const toast = await this.toastController.create({
                message: 'Bug: no preset sent to edit',
                duration: 2000,
                position: 'top'
            });
            toast.present();
        }
    }

    tagsForPreset(preset) {
        const tags = [];
        if (preset.type_str) {
            tags.push(preset.type_str);
        } else {
            tags.push('Unknown');
        }
        if (preset['charge_current']) {
            tags.push('+ ' + preset['charge_current'] + 'A');
        }
        if (preset['discharge_current']) {
            tags.push('- ' + preset['discharge_current'] + 'A');
        }
        if (preset.cells > 0) {
            tags.push(preset.cells + 's');
        }
        return tags;
    }

    chemistryClass: () => string;
}

applyMixins(PresetListPage, [Chemistry]);