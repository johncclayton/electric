import {Component} from "@angular/core";
import {IChargerAppState} from "../../models/state/configure";
import {ConfigurationActions} from "../../models/state/charger";
import {IConfig} from "../../models/state/config";
import {NgRedux, select} from "@angular-redux/store";
import {Observable} from "rxjs/Observable";
import {Platform} from "ionic-angular";
import {IStatus} from "../../models/state/state";

@Component({
    selector: 'page-config',
    templateUrl: 'config-page.html',
    providers: [ConfigurationActions]
})
export class ConfigPage {
    @select() config$: Observable<IConfig>;
    @select() status$: Observable<IStatus>;

    constructor(private ngRedux: NgRedux<IChargerAppState>, private actions: ConfigurationActions, private platform: Platform) {

    }

    canUseDeploy(): boolean {
        return this.platform.is('cordova');
    }

    platformsString(): string {
        return this.platform.platforms().toString();
    }

}
