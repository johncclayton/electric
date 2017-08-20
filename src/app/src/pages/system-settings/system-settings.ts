import {Component} from '@angular/core';
import {AlertController, IonicPage, NavController, NavParams, Toast, ToastController} from 'ionic-angular';
import {NgRedux, select} from "@angular-redux/store";
import {IAppState} from "../../models/state/configure";
import {Observable} from "rxjs/Observable";
import {ISystem} from "../../models/state/reducers/system";
import {SystemActions} from "../../models/state/actions/system";
import {objectHasBeenModified} from "../../utils/helpers";
import {IUIState} from "../../models/state/reducers/ui";
import {System} from "../../models/system";
import {UIActions} from "../../models/state/actions/ui";
import {Subject} from "rxjs/Subject";

@IonicPage()
@Component({
    selector: 'page-system-settings',
    templateUrl: 'system-settings.html',
})
export class SystemSettingsPage {
    @select() system$: Observable<ISystem>;
    @select() ui$: Observable<IUIState>;

    originalUnmodified: System;
    savingAlert: Toast;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    constructor(public navCtrl: NavController,
                public actions: SystemActions,
                public uiActions: UIActions,
                public toastController: ToastController,
                public alertController: AlertController,
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
        let system = this.ngRedux.getState().system.system;

        this.actions.saveSystemSettings(system)
            .takeUntil(this.ngUnsubscribe)
            .subscribe(sys => {
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
        let current = this.ngRedux.getState().system.system;
        return objectHasBeenModified(this.originalUnmodified, current);
    }

    ionViewCanLeave() {
        if (this.settingsAreModified) {
            let current = this.ngRedux.getState().system.system;
            return this.changeAlert(current);
        }
    }

    ionViewDidLoad() {
        this.system$
            .takeUntil(this.ngUnsubscribe)
            .subscribe((v: ISystem) => {
            if (v.fetching == true) {

            }
            if (v.fetching == false) {
                console.log("I've made a clone...");
                this.originalUnmodified = v.system.clone();
            }
        });
        this.actions.fetchSystemFromCharger();
    }

    private changeAlert(system: System) {
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
                                .subscribe(sys => {
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
