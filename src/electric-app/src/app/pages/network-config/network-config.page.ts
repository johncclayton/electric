import {AfterContentInit, Component, OnDestroy, OnInit} from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {Observable} from 'rxjs';
import {IConfig} from '../../models/state/reducers/configuration';
import {Platform} from '@ionic/angular';
import {IAppState} from '../../models/state/configure';
import {iChargerService} from '../../services/icharger.service';
import {ConfigurationActions} from '../../models/state/actions/configuration';
import {Zeroconf} from '@ionic-native/zeroconf/ngx';
import {Router} from '@angular/router';
import {CustomNGXLoggerService, NGXLogger, NgxLoggerLevel} from 'ngx-logger';

@Component({
    selector: 'network-config-page',
    templateUrl: './network-config.page.html',
    styleUrls: ['./network-config.page.scss'],
})
export class NetworkConfigPage implements OnInit, AfterContentInit, OnDestroy {
    @select() config$: Observable<IConfig>;
    @select(['config', 'network', 'current_ip_address']) current_ip_address$: Observable<IConfig>;
    private logger: NGXLogger;

    constructor(
        private ngRedux: NgRedux<IAppState>,
        private zeroConf: Zeroconf,
        private platform: Platform,
        private router: Router,
        private loggerSvc: CustomNGXLoggerService,
        private iChargerService: iChargerService,
        public actions: ConfigurationActions) {
        this.logger = this.loggerSvc.create({level: NgxLoggerLevel.INFO});
    }

    ngAfterContentInit() {
        if (this.canUseZeroconf()) {
            // this.logger.log("Watching for servers...");
            this.zeroConf.watch('_http._tcp', 'local.').subscribe(r => {
                if (r.service.ipv4Addresses.length > 0) {
                    let ipAddress = r.service.ipv4Addresses[0];
                    let name = r.service.name;

                    if (name.indexOf('Electric REST API') >= 0) {
                        // console.log("Action: ", r.action, ", ", name, ", ", ipAddress);
                        if (r.action == 'resolved') {
                            // console.log("I see: ", name);
                            this.actions.addDiscoveredServer(ipAddress);
                        } else {
                            // console.log(name, "removed");
                            this.actions.removeDiscoveredServer(ipAddress);
                        }
                    }
                }
            });
        } else {
            this.logger.info('Cant use ZeroConf, so won\'t watch for servers');
        }


        // Disable standard polling, so we can change the network without standard retry
        // logging happening
        this.iChargerService.stopAllPolling();
        this.iChargerService.startPollingStatusServer();

        // this.showWizard();
    }

    ngOnInit() {
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
        return has_cordova;
    }

    showWizard() {
        this.router.navigateByUrl('NetworkWizard');
    }

}
