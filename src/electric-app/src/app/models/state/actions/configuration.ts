import {Injectable} from '@angular/core';
import {IAppState} from '../configure';
import {NgRedux} from '@angular-redux/store';
import * as _ from 'lodash';
import {compareTwoMaps} from '../../../utils/helpers';


@Injectable({
    providedIn: 'root'
})
export class ConfigurationActions {
    static RESET_TO_DEFAULTS: string = 'RESET_TO_DEFAULTS';
    static RESET_CHARGE_SETTINGS_TO_DEFAULTS: string = 'RESET_CHARGE_SETTINGS_TO_DEFAULTS';
    static UPDATE_CONFIG_KEYVALUE: string = 'UPDATE_CONFIG_KEYVALUE';
    static UPDATE_CHARGE_CONFIG_KEYVALUE: string = 'UPDATE_CHARGE_CONFIG_KEYVALUE';
    static CONFIG_SAVED_TO_STORE: string = 'CONFIG_SAVED_TO_STORE';
    static SET_FULL_CONFIG: string = 'SET_FULL_CONFIG';

    constructor(private ngRedux: NgRedux<IAppState>) {
    }

    resetToDefaults() {
        this.ngRedux.dispatch({
            type: ConfigurationActions.RESET_TO_DEFAULTS,
            payload: {}
        });
    }

    resetChargeSettingsToDefaults() {
        this.ngRedux.dispatch({
            type: ConfigurationActions.RESET_CHARGE_SETTINGS_TO_DEFAULTS
        });
    }

    addDiscoveredServer(ipAddress: string) {
        if (!ipAddress || ipAddress == '') {
            return;
        }

        // Filter our any discovery on the private subnet
        if (ipAddress.startsWith('192.168.10')) {
            return;
        }

        let config = this.ngRedux.getState().config;
        let existing = config.network.discoveredServers;
        let new_set = _.uniq([
            ...existing,
            ...[ipAddress]
        ]);

        // console.log("Existing: " + existing + " type: " + typeof (existing) + ". Is Array: " + isArray(existing) + ", len: " + existing.length);

        let newState = {
            network: {
                discoveredServers: new_set
            }
        };
        // console.log("Added discovered server: " + ipAddress + " for: " + newState.network.discoveredServers.join(","));

        this.updateConfiguration(newState);
    }

    removeDiscoveredServer(ipAddress: string) {
        console.log('Removing ' + ipAddress + ' from discovery list');
        let existing = this.ngRedux.getState().config.network;
        let newState = existing.discoveredServers.filter((s) => {
            return s != ipAddress;
        });
        this.setConfiguration('network', {'discoveredServers': newState});
    }

    setConfiguration(key: string, value: any) {
        let change = [];
        change[key] = value;
        this.updateConfiguration(change);
    }

    updateConfigurationFromEmit(change) {
        let map_change = {};
        let key = Object.keys(change)[0];
        map_change[key] = change[key];
        this.updateConfiguration(map_change);
    }

    updateNetworkFromEmit(change) {
        let map_change = {};
        let key = Object.keys(change)[0];
        map_change[key] = change[key];
        this.updateNetwork(map_change);
    }

    updateNetwork(change) {
        let actual = {
            network: change
        };
        this.updateConfiguration(actual);
    }

    updateConfiguration(change) {
        // Check the change type, coerce values
        if (change != null) {
            let config = this.ngRedux.getState().config;

            // Check to see if any values have changed
            let comparison_result = compareTwoMaps(change, config);
            if (comparison_result.length > 0) {
                console.log('Keys differ: ' + comparison_result.join(', '));
                this.ngRedux.dispatch({
                    type: ConfigurationActions.UPDATE_CONFIG_KEYVALUE,
                    payload: change
                });
            }
        }
    }

    resetNetworkAtrributes() {
        this.updateConfiguration({
            network: {
                is_applying_change: false,
                last_status_update: null,
                ap_channel: 0,
                docker_last_deploy: 0,
                web_running: false,
                worker_running: false,
            }
        });
    }

    endWifiChange() {
        this.updateConfiguration({
            network: {
                is_applying_change: false
            }
        });
    }

    startWifiChange() {
        this.updateConfiguration({
            network: {
                is_applying_change: true
            }
        });
    }
}

