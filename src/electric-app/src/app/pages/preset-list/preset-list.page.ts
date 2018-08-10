import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ChemistryType, Preset} from '../../models/preset-class';
import {List, NavController, ToastController} from '@ionic/angular';
import {Subject} from 'rxjs';
import {iChargerService} from '../../services/icharger.service';
import {takeUntil} from 'rxjs/operators';
import {DataBagService} from '../../services/data-bag.service';
import {applyMixins} from 'rxjs/internal-compatibility';
import {Chemistry} from '../../utils/mixins';

@Component({
    selector: 'app-preset-list',
    templateUrl: './preset-list.page.html',
    styleUrls: ['./preset-list.page.scss'],
})
export class PresetListPage implements OnInit, OnDestroy {

    firstLoad: boolean = true;
    public presets: Array<Preset>;
    @ViewChild(List) list: List;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public navCtrl: NavController,
                private dataBag: DataBagService,
                public chargerService: iChargerService,
                public toastController: ToastController) {
    }

    ngOnInit() {
        this.refreshPresets(null);
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    refreshPresets(refresher) {
        this.chargerService.getPresets()
            .pipe(
                takeUntil(this.ngUnsubscribe)
            ).subscribe(presetsList => {
            this.presets = presetsList;
            this.firstLoad = false;
            if (refresher) {
                refresher.complete();
            }

            /*
             * Was used during testing, to move to a known preset and edit it.
             */
            let debugPresets = false;
            if (debugPresets) {
                if (this.presets.length) {
                    let old_preset = this.presets[7];
                    this.setPresetAndCallback(old_preset);
                    this.navCtrl.goForward('Preset');
                }
            }
        });
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
            console.log('Got result ', new_preset, ' from the save call');
            old_preset.updateFrom(new_preset);
        }
    }

    async editPreset(preset) {
        if (preset) {
            console.log('Editing preset type: ', preset.type, 'usage: ', preset.data.use_flag);
            if (preset.type == ChemistryType.LiPo ||
                preset.type == ChemistryType.NiMH ||
                preset.type == ChemistryType.LiFe) {

                this.setPresetAndCallback(preset);
                this.navCtrl.goForward('Preset');
            } else {
                let toast = await this.toastController.create({
                    message: 'Only support editing Lipo/NiMH/LiFe for now',
                    duration: 2000,
                    // dismissOnPageChange: true, // causes an exception. meh.
                    position: 'top'
                });
                toast.present();
            }
        } else {
            let toast = await this.toastController.create({
                message: 'Bug: no preset sent to edit',
                duration: 2000,
                position: 'top'
            });
            toast.present();
        }
    }

    tagsForPreset(preset) {
        let tags = [];
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