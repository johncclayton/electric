import {Injectable} from '@angular/core';
import {IConfig} from '../models/state/reducers/configuration';
import {NgRedux} from '@angular-redux/store';
import {IAppState} from '../models/state/configure';
import {IUIState} from '../models/state/reducers/ui';

@Injectable({
    providedIn: 'root'
})
export class URLService {
    constructor(private ngRedux: NgRedux<IAppState>) {
    }

    getConfig(): IConfig {
        return this.ngRedux.getState().config;
    }

    public static getHostNameUsingConfigAndState(config: IConfig, ui: IUIState, port: number) {
        // If on index 0, use private WLAN address
        if (config.lastConnectionIndex == 0) {
            return '192.168.10.1:' + port;
        }

        // If disconnected, do a round robbin between various known IP addresses
        return config.ipAddress + ':' + port;
    }


    getHostName(): string {
        let config = this.getConfig();
        let state = this.ngRedux.getState();
        return URLService.getHostNameUsingConfigAndState(config, state.ui, config.port);
    }

    getManagementHostName(): string {
        let config = this.getConfig();
        let state = this.ngRedux.getState();
        return URLService.getHostNameUsingConfigAndState(config, state.ui, config.port - 1);
    }

    // Gets the status of the charger
    getChargerURL(path) {
        return 'http://' + this.getHostName() + path;
    }

    getManagementURL(path) {
        return 'http://' + this.getManagementHostName() + path;
    }
}
