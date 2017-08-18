import {Component, Inject} from "@angular/core";
import {ConfigurationActions} from "../../models/state/actions/configuration";
import {IConfig} from "../../models/state/reducers/configuration";
import {select} from "@angular-redux/store";
import {Observable} from "rxjs/Observable";
import {Platform} from "ionic-angular";
import {IChargerState} from "../../models/state/reducers/charger";
import {IUIState} from "../../models/state/reducers/ui";
import {environmentFactory} from "../../app/environment/environment-variables.module";

@Component({
    selector: 'page-config',
    templateUrl: 'config-page.html',
    providers: [ConfigurationActions]
})
export class ConfigPage {
    @select() config$: Observable<IConfig>;
    @select() charger$: Observable<IChargerState>;
    @select() ui$: Observable<IUIState>;

    constructor(private platform: Platform,
                private actions: ConfigurationActions) {

    }

    canUseDeploy(): boolean {
        return this.platform.is('cordova');
    }

    platformsString(): string {
        return this.platform.platforms().toString();
    }

    get isProduction(): boolean {
        let environment = environmentFactory();
        return environment.ionicEnvName == 'prod';
    }

    environmentStrings(): string[] {
        let environment = environmentFactory();
        let callbackfn = (value): string => {
            return value + " = " + environment[value];
        };
        return Object.keys(environment).map(callbackfn);
    }
}
