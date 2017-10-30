import {Component, Inject} from "@angular/core";
import {ConfigurationActions} from "../../models/state/actions/configuration";
import {IConfig} from "../../models/state/reducers/configuration";
import {NgRedux, select} from "@angular-redux/store";
import {Observable} from "rxjs/Observable";
import {Platform} from "ionic-angular";
import {IChargerState} from "../../models/state/reducers/charger";
import {IUIState} from "../../models/state/reducers/ui";
import {Zeroconf} from "@ionic-native/zeroconf";
import {System} from "../../models/system";
import {IAppState} from "../../models/state/configure";

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
                private ngRedux: NgRedux<IAppState>,
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

    haveZeroConfAddresses(): boolean {
        let config = this.ngRedux.getState().config;
        return config.discoveredServers.length > 0;
    }

    canUseZeroconf(): boolean {
        let has_cordova = this.platform.is('cordova');
        return has_cordova && this.isProduction;
    }

    canUseDeploy(): boolean {
        return this.platform.is('cordova');
    }

    platformsString(): string {
        return this.platform.platforms().toString();
    }

    get isProduction(): boolean {
        return System.isProduction;
    }

    environmentStrings(): string[] {
        return System.environmentStrings();
    }
}
