import {Component} from '@angular/core';
import {IonicPage, NavController, Platform} from 'ionic-angular';
import {Zeroconf} from "@ionic-native/zeroconf";
import {System} from "../../models/system";
import {NgRedux, select} from "@angular-redux/store";
import {IAppState} from "../../models/state/configure";
import {ConfigurationActions} from "../../models/state/actions/configuration";
import {iChargerService} from "../../services/icharger.service";
import {Observable} from "rxjs/Observable";
import {IConfig} from "../../models/state/reducers/configuration";

@IonicPage()
@Component({
    selector: 'page-network',
    templateUrl: 'network-page.html',
})
export class NetworkPage {
    @select() config$: Observable<IConfig>;

    constructor(public navCtrl: NavController,
                private ngRedux: NgRedux<IAppState>,
                private zeroConf: Zeroconf,
                private platform: Platform,
                private iChargerService: iChargerService,
                private actions: ConfigurationActions) {
    }

    ionViewDidLoad() {
        if (this.canUseZeroconf()) {
            console.log("Watching for servers...");
            this.zeroConf.watch("_http._tcp", "local.").subscribe(r => {
                if (r.service.ipv4Addresses.length > 0) {
                    let ipAddress = r.service.ipv4Addresses[0];
                    let name = r.service.name;

                    if (name.indexOf("Electric REST API") >= 0) {
                        // console.log("Action: ", r.action, ", ", name, ", ", ipAddress);
                        if (r.action == "resolved") {
                            console.log("I see: ", name);
                            this.actions.addDiscoveredServer(ipAddress);
                        } else {
                            console.log(name, "removed");
                            this.actions.removeDiscoveredServer(ipAddress);
                        }
                    }
                }
            });
        } else {
            console.log("Cant use ZeroConf, so won't watch for servers");
        }


        // Disable standard polling, so we can change the network without standard retry
        // logging happening
        this.iChargerService.stopAllPolling();
        this.iChargerService.startPollingStatusServer();
    }

    ngOnDestroy() {
        if (this.canUseZeroconf()) {
            this.zeroConf.close();
        }

        this.iChargerService.stopAllPolling();
        this.iChargerService.startPollingCharger();
    }

    haveZeroConfAddresses(): boolean {
        let config = this.ngRedux.getState().config;
        let discoveredServers = config.network.discoveredServers;
        if (discoveredServers != null) {
            return discoveredServers.length > 0;
        }
        return false;
    }

    canUseZeroconf(): boolean {
        let has_cordova = this.platform.is('cordova');
        // return has_cordova && System.isProduction;
        return has_cordova ;
    }

    sendWifiSettings() {
        let network = this.ngRedux.getState().config.network;
        console.log("Sending settings...");
        this.iChargerService.updateWifi(network.wifi_ssid, network.wifi_password);
    }


}
