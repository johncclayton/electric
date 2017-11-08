import {Injectable} from "@angular/core";
import {IAppState} from "../configure";
import {NgRedux} from "@angular-redux/store";
import * as _ from "lodash";


@Injectable()
export class ConfigurationActions {
    static RESET_TO_DEFAULTS: string = 'RESET_TO_DEFAULTS';
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

    addDiscoveredServer(ipAddress: string) {
        let config = this.ngRedux.getState().config;
        let existing = config.network.discoveredServers;
        if(existing == null) {
            existing = [];
        }
        let newState = {
            network: {
                discoveredServers: [
                    ...existing,
                    ipAddress
                ]
            }
        };

        this.updateConfiguration(newState);
    }

    removeDiscoveredServer(ipAddress: string) {
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

    // isValueDifferent(left: Object, right: Object) {
    //     for (let in_key in left) {
    //         let value_changed = false;
    //         if (right.hasOwnProperty(in_key)) {
    //             let existing_value = right[in_key];
    //             value_changed = left[in_key] != existing_value;
    //             if (value_changed) {
    //                 console.log("CHANGE: " + in_key + " from " + left[in_key] + " to " + existing_value);
    //                 return true;
    //             }
    //         }
    //     }
    //     return false;
    // }
    //
    compareTwoMaps(new_data, old_data) {
        let result = [];

        return _.reduce(new_data, (result, value, key) => {
            if (old_data.hasOwnProperty(key)) {
                if (_.isEqual(value, old_data[key])) {
                    return result;
                } else {
                    if (typeof (new_data[key]) != typeof ({}) || typeof (old_data[key]) != typeof ({})) {
                        //dead end.
                        result.push(key);
                        return result;
                    } else {
                        let deeper = this.compareTwoMaps(new_data[key], old_data[key]);
                        return result.concat(_.map(deeper, (sub_path) => {
                            return key + "." + sub_path;
                        }));
                    }
                }
            } else {
                result.push(key);
                return result;
            }
        }, result);
    }

    updateConfigurationFromEmit(change) {
        let map_change = {};
        let key = Object.keys(change)[0];
        map_change[key] = change[key];
        this.updateConfiguration(map_change);
    }

    updateConfiguration(change) {
        // Check the change type, coerce values
        if (change != null) {
            let config = this.ngRedux.getState().config;


            // Check to see if any values have changed
            let comparison_result = this.compareTwoMaps(change, config);
            if (comparison_result.length > 0) {
                console.log("Keys differ: " + comparison_result.join(", "));
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
                ap_channel: 0,
                docker_last_deploy: 0,
                web_running: false,
                worker_running: false,
            }
        });
    }
}

