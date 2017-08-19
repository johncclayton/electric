import {Component} from '@angular/core';
import {AlertController, IonicPage, NavController, NavParams} from 'ionic-angular';
import {NgRedux, select} from "@angular-redux/store";
import {IAppState} from "../../models/state/configure";
import {Observable} from "rxjs/Observable";
import {ISystem} from "../../models/state/reducers/system";
import {SystemActions} from "../../models/state/actions/system";
import {objectHasBeenModified} from "../../utils/helpers";
import {IUIState} from "../../models/state/reducers/ui";
import {System} from "../../models/system";
import {UIActions} from "../../models/state/actions/ui";

@IonicPage()
@Component({
    selector: 'page-system-settings',
    templateUrl: 'system-settings.html',
})
export class SystemSettingsPage {
    @select() system$: Observable<ISystem>;
    @select() ui$: Observable<IUIState>;

    originalUnmodified: System;

    constructor(public navCtrl: NavController,
                public actions: SystemActions,
                public uiActions: UIActions,
                public alertController: AlertController,
                public navParams: NavParams,
                private ngRedux: NgRedux<IAppState>) {
    }

    ionViewCanLeave() {
        if (this.originalUnmodified != null) {
            let current = this.ngRedux.getState().system.system;
            if (objectHasBeenModified(this.originalUnmodified, current)) {
                return this.changeAlert(current);
            }
        }
    }

    ionViewDidLoad() {
        this.system$.subscribe((v: ISystem) => {
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
                            this.actions.saveSystemSettings(system).subscribe(sys => {
                                resolve();
                            }, err => {
                                this.uiActions.setErrorMessage(err);
                                reject();
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
