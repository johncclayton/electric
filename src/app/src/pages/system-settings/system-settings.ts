import {Component} from '@angular/core';
import {AlertController, IonicPage, NavController, Toast, ToastController} from 'ionic-angular';
import {NgRedux, select} from "@angular-redux/store";
import {IAppState} from "../../models/state/configure";
import {Observable} from "rxjs/Observable";
import {SystemActions} from "../../models/state/actions/system";
import {propertiesThatHaveBeenModified} from "../../utils/helpers";
import {IUIState} from "../../models/state/reducers/ui";
import {UIActions} from "../../models/state/actions/ui";
import {Subject} from "rxjs/Subject";
import {LocalNotifications} from "@ionic-native/local-notifications";
import {ISystem} from "../../models/state/reducers/system";
import {iChargerService} from "../../services/icharger.service";
import {cloneDeep} from 'lodash';

@IonicPage()
@Component({
    selector: 'page-system-settings',
    templateUrl: 'system-settings.html',
})
export class SystemSettingsPage {
    @select() system$: Observable<ISystem>;
    @select() ui$: Observable<IUIState>;

    originalUnmodified: ISystem;
    savingAlert: Toast;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    constructor(private navCtrl: NavController,
                private actions: SystemActions,
                private uiActions: UIActions,
                private charger: iChargerService,
                private toastController: ToastController,
                private localNotifications: LocalNotifications,
                private alertController: AlertController,
                private ngRedux: NgRedux<IAppState>) {
    }

    createSaveAlert() {
        this.savingAlert = this.toastController.create({
            'message': "Saving...",
            'position': 'bottom',
        });
        this.savingAlert.present();
        return this.savingAlert;
    }

    saveSettings() {
        this.createSaveAlert();
        let iSystem = this.ngRedux.getState().system;

        this.actions.saveSystemSettings(iSystem)
            .takeUntil(this.ngUnsubscribe)
            .subscribe(ignored_value => {
            }, err => {
                this.uiActions.setErrorMessage(err);
            }, () => {
                this.savingAlert.dismiss();
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
            console.log("Modified: " + JSON.stringify(modifiedProperties));
        }
        return keys.length > 0;
    }

    ionViewCanLeave() {
        if (this.settingsAreModified) {
            return this.changeAlert(this.ngRedux.getState().system);
        }
    }

    ionViewDidLeave() {
    }

    ionViewDidLoad() {
        this.system$
            .takeUntil(this.ngUnsubscribe)
            .subscribe((v: ISystem) => {
                if (v.fetching == true) {

                }
                if (v.fetching == false) {
                    console.log("I've made a clone...");

                    // This'll make a deep clone
                    this.originalUnmodified = cloneDeep(v);
                }
            });
        this.actions.fetchSystemFromCharger();
    }

    ionViewWillEnter() {
    }

    private changeAlert(system: ISystem) {
        return new Promise((resolve, reject) => {
            let alert = this.alertController.create({
                title: "Save settings",
                message: "Do you want to save to the charger?",
                buttons: [
                    {
                        text: "Save",
                        handler: () => {
                            this.createSaveAlert();
                            this.actions.saveSystemSettings(system)
                                .takeUntil(this.ngUnsubscribe)
                                .subscribe(ignored_value => {
                                    resolve();
                                }, err => {
                                    this.uiActions.setErrorMessage(err);
                                    reject();
                                }, () => {
                                    this.savingAlert.dismiss();
                                });
                        }
                    },
                    {
                        text: "Discard",
                        handler: () => {
                            resolve();
                        }
                    },
                    {
                        text: "Cancel",
                        handler: () => {
                            reject();
                        }
                    }
                ]
            });
            alert.present();
        });
    }

}
