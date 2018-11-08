import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {ISystem} from '../../models/state/reducers/system';
import {Observable, of, Subject} from 'rxjs';
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
import {ICanDeactivate} from '../../services/can-deactivate-preset-guard.service';
import {fromPromise} from 'rxjs/internal-compatibility';
import {ToastHelper} from '../../utils/messaging';

@Component({
    selector: 'system-settings-page',
    templateUrl: './system-settings.page.html',
    styleUrls: ['./system-settings.page.scss'],
})
export class SystemSettingsPage implements OnInit, OnDestroy, ICanDeactivate {
    @select() system$: Observable<ISystem>;
    @select() ui$: Observable<IUIState>;

    originalUnmodified: ISystem;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        public actions: SystemActions,
        private uiActions: UIActions,
        private charger: iChargerService,
        private toastController: ToastController,
        private messaging: ToastHelper,
        private localNotifications: LocalNotifications,
        private alertController: AlertController,
        private ngRedux: NgRedux<IAppState>) {
    }

    ngOnInit() {
        console.debug(`Listening for system changes...`);
        this.system$
            .pipe(
                takeUntil(this.ngUnsubscribe)
            ).subscribe((v: ISystem) => {
            if (v.fetching == true) {
            }
            if (v.fetching == false) {
                // console.debug(`New system object, I've made a clone...`);
                // This'll make a deep clone
                this.originalUnmodified = cloneDeep(v);
            }
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
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
                this.uiActions.setErrorFromErrorObject('Failed to save settings', err);
            }, () => {
                // console.warn(`Settings save completed!`);
                alert.dismiss().then(() => {
                    this.messaging.showMessage('Settings saved');
                });
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
            // console.debug('Modified System: ' + JSON.stringify(modifiedProperties));
        }
        return keys.length > 0;
    }

    canDeactivate(): Observable<boolean> {
        if (this.settingsAreModified) {
            return this.changeAlert();
        } else {
            return of(true);
        }
    }

    guardOnlyTheseURLs(): Array<string> | null {
        return null;
    }


    private changeAlert(): Observable<boolean> {
        return Observable.create(obs => {
            this.alertController.create({
                header: 'Save settings',
                message: 'Do you want to save to the charger?',
                buttons: [
                    {
                        text: 'Save',
                        handler: () => {
                            this.saveSettings().then(r => {
                                obs.next(true);
                                obs.complete();
                            });
                        }
                    },
                    {
                        text: 'Discard',
                        handler: () => {
                            obs.next(true);
                            obs.complete();
                        }
                    },
                    {
                        text: 'Cancel',
                        handler: () => {
                            obs.next(false);
                            obs.complete();
                        }
                    }
                ]
            }).then(r => {
                r.present();
            });
        });
    }
}
