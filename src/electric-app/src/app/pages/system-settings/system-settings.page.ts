import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {ISystem} from '../../models/state/reducers/system';
import {Observable, Subject} from 'rxjs';
import {IUIState} from '../../models/state/reducers/ui';
import {AlertController, ToastController} from '@ionic/angular';
import {SystemActions} from '../../models/state/actions/system';
import {UIActions} from '../../models/state/actions/ui';
import {iChargerService} from '../../services/icharger.service';
import {propertiesThatHaveBeenModified} from '../../utils/helpers';
import {takeUntil} from 'rxjs/operators';
import {cloneDeep} from 'lodash';
import {LocalNotifications} from '@ionic-native/local-notifications/ngx';
import {IAppState} from '../../models/state/configure';

@Component({
    selector: 'system-settings-page',
    templateUrl: './system-settings.page.html',
    styleUrls: ['./system-settings.page.scss'],
})
export class SystemSettingsPage implements OnInit, OnDestroy {
    @select() system$: Observable<ISystem>;
    @select() ui$: Observable<IUIState>;

    originalUnmodified: ISystem;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    ngOnInit() {
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    constructor(
        public actions: SystemActions,
        private uiActions: UIActions,
        private charger: iChargerService,
        private toastController: ToastController,
        private localNotifications: LocalNotifications,
        private alertController: AlertController,
        private ngRedux: NgRedux<IAppState>) {
    }

    async presentSaveAlert() {
        const alert = await this.toastController.create({
            'message': 'Saving...',
            'position': 'bottom',
        });
        alert.present();
        return alert;
    }

    async saveSettings() {
        const alert = await this.presentSaveAlert();
        let iSystem = this.ngRedux.getState().system;

        this.actions.saveSystemSettings(iSystem)
            .pipe(
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe(ignored_value => {
            }, err => {
                this.uiActions.setErrorMessage(err);
            }, () => {
                alert.dismiss();
            });
    }

    get settingsAreModified(): boolean {
        if (this.originalUnmodified == null) {
            return false;
        }

        /*
        The follow works for the case fan as well.
        If we DONT have case_fan, then there will be some state, but it'll never change.
        If we DO, then it'll be there, but possibly changing. So don't actually have to explicitly check for it.
         */
        let system = this.ngRedux.getState().system;
        let modifiedProperties = propertiesThatHaveBeenModified(this.originalUnmodified, system);
        let keys = Object.keys(modifiedProperties);

        if (keys.length > 0) {
            console.log('Modified: ' + JSON.stringify(modifiedProperties));
        }
        return keys.length > 0;
    }

    ionViewCanLeave() {
        if (this.settingsAreModified) {
            return this.changeAlert(this.ngRedux.getState().system);
        }
    }

    ionViewDidLoad() {
        this.system$
            .pipe(
                takeUntil(this.ngUnsubscribe)
            ).subscribe((v: ISystem) => {
            if (v.fetching == true) {
            }
            if (v.fetching == false) {
                console.log('I\'ve made a clone...');

                // This'll make a deep clone
                this.originalUnmodified = cloneDeep(v);
            }
        });
        this.actions.fetchSystemFromCharger();
    }

    private async changeAlert(system: ISystem) {
        let alert = await this.alertController.create({
            header: 'Save settings',
            message: 'Do you want to save to the charger?',
            buttons: [
                {
                    text: 'Save',
                    handler: () => {
                        this.saveSettings();
                    }
                },
                {
                    text: 'Discard',
                    handler: () => {
                    }
                },
                {
                    text: 'Cancel',
                    handler: () => {
                    }
                }
            ]
        });
        alert.present();
    }
}
