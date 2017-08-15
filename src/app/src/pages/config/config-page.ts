import {Component} from "@angular/core";
import {IAppState} from "../../models/state/configure";
import {ConfigurationActions} from "../../models/state/actions/configuration";
import {IConfig} from "../../models/state/reducers/configuration";
import {NgRedux, select} from "@angular-redux/store";
import {Observable} from "rxjs/Observable";
import {Platform} from "ionic-angular";
import {IChargerState} from "../../models/state/reducers/charger";
import {IUIState} from "../../models/state/reducers/ui";

@Component({
    selector: 'page-config',
    templateUrl: 'config-page.html',
    providers: [ConfigurationActions]
})
export class ConfigPage {
    @select() config$: Observable<IConfig>;
    @select() charger$: Observable<IChargerState>;
    @select() ui$: Observable<IUIState>;

    constructor(private ngRedux: NgRedux<IAppState>,
                private actions: ConfigurationActions,
                private platform: Platform) {

    }

    canUseDeploy(): boolean {
        return this.platform.is('cordova');
    }

    platformsString(): string {
        return this.platform.platforms().toString();
    }

    testFunc() {
        let mockCharger = this.ngRedux.getState().config.mockCharger;
        this.actions.updateConfiguration({"mockCharger": !mockCharger});
        console.log("Boo");
    }
}
