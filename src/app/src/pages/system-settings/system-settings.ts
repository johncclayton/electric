import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {NgRedux, select} from "@angular-redux/store";
import {IAppState} from "../../models/state/configure";
import {Observable} from "rxjs/Observable";
import {ISystem} from "../../models/state/reducers/system";
import {SystemActions} from "../../models/state/actions/system";

@IonicPage()
@Component({
    selector: 'page-system-settings',
    templateUrl: 'system-settings.html',
})
export class SystemSettingsPage {
    @select() system$: Observable<ISystem>;
    @select() ui$: Observable<ISystem>;

    constructor(public navCtrl: NavController,
                public systemActions: SystemActions,
                public navParams: NavParams,
                ngRedux: NgRedux<IAppState>) {
    }

    ionViewDidLoad() {
        this.refreshSystem(null);
    }

    refreshSystem(refresher) {
        // Listen for end fetch and mark refresher as done
        if(refresher != null) {
            this.system$.subscribe((v) => {
                if (v.fetching == false) {
                    refresher.complete();
                }
            });
        }

        this.systemActions.fetchSystemFromCharger();
    }
}
