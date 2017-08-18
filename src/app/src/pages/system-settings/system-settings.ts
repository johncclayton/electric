import {Component} from '@angular/core';
import {AlertController, IonicPage, NavController, NavParams} from 'ionic-angular';
import {NgRedux, select} from "@angular-redux/store";
import {IAppState} from "../../models/state/configure";
import {Observable} from "rxjs/Observable";
import {ISystem} from "../../models/state/reducers/system";
import {SystemActions} from "../../models/state/actions/system";
import {System} from "../../models/system";
import {cloneDeep, objectHasBeenModified} from "../../utils/helpers";

@IonicPage()
@Component({
    selector: 'page-system-settings',
    templateUrl: 'system-settings.html',
})
export class SystemSettingsPage {
    @select() system$: Observable<ISystem>;
    @select() ui$: Observable<ISystem>;

    originalUnmodified: System;

    constructor(public navCtrl: NavController,
                public actions: SystemActions,
                public alertController: AlertController,
                public navParams: NavParams,
                private ngRedux: NgRedux<IAppState>) {
    }

    ionViewCanLeave() {
        if (this.originalUnmodified != null) {
            console.log("Have original...");
            let current = this.ngRedux.getState().system.system;
            if (objectHasBeenModified(this.originalUnmodified, current)) {
                return this.changeAlert();
            } else {
                console.log("Have identical original...");
            }
        } else {
            console.log("I don't have original...?");
        }
    }

    ionViewDidLoad() {
        this.system$.subscribe((v: ISystem) => {
            if(v.fetching == true) {

            }
            if (v.fetching == false) {
                console.log("I've made a clone...");
                this.originalUnmodified = cloneDeep(v.system);
            }
        });
        this.actions.fetchSystemFromCharger();
    }

    private changeAlert() {
        return new Promise((resolve, reject) => {
            let alert = this.alertController.create({
                title: "Save settings",
                message: "Do you want to save to the charger?",
                buttons: [
                    {
                        text: "Save",
                        handler: () => {
                            resolve();
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
            })
        });
    }

}
