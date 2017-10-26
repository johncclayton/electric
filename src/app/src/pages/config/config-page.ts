import {Component, Inject} from "@angular/core";
import {ConfigurationActions} from "../../models/state/actions/configuration";
import {IConfig} from "../../models/state/reducers/configuration";
import {select} from "@angular-redux/store";
import {Observable} from "rxjs/Observable";
import {Platform} from "ionic-angular";
import {IChargerState} from "../../models/state/reducers/charger";
import {IUIState} from "../../models/state/reducers/ui";
import {environmentFactory} from "../../app/environment/environment-variables.module";
import {Zeroconf} from "@ionic-native/zeroconf";

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
                private zeroConf: Zeroconf,
                private actions: ConfigurationActions) {

        if (this.canUseZeroconf()) {
            this.zeroConf.watch("_http._tcp", "local.").subscribe(r => {
                if (r.service.ipv4Addresses.length > 0) {
                    let ipAddress = r.service.ipv4Addresses[0];
                    let name = r.service.name;

                    if (name.indexOf("Electric REST API") >= 0) {
                        // console.log("Action: ", r.action, ", ", name, ", ", ipAddress);
                        if (r.action == "resolved") {
                            // console.log("I see: ", name);
                            this.actions.addDiscoveredServer(ipAddress);
                        } else {
                            // console.log(name, "removed");
                            this.actions.removeDiscoveredServer(ipAddress);
                        }
                    }
                }
            });
        }
    }

    ngOnDestroy() {
        if (this.canUseZeroconf()) {
            this.zeroConf.close();
        }
    }

    canUseZeroconf(): boolean {
        // return false;
        return this.platform.is('cordova');
        // return this.platform.is('ios') || this.platform.is('android');
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
