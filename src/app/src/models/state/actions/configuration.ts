import {Injectable} from "@angular/core";
import {IAppState} from "../configure";
import {NgRedux} from "@angular-redux/store";
import {validateAnimationSequence} from "@angular/animations/browser/src/dsl/animation_validator_visitor";


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
        let newState = {
            // discoveredServers: _.uniq([
            //     ...config.discoveredServers,
            //     ipAddress
            // ])
            discoveredServers: [
                ...config.discoveredServers,
                ipAddress
            ]
        };

        this.updateConfiguration(newState);
    }

    removeDiscoveredServer(ipAddress: string) {
        let existing = this.ngRedux.getState().config;
        let newState = existing.discoveredServers.filter((s) => {
            return s != ipAddress;
        });
        this.setConfiguration('discoveredServers', newState);
    }

    setConfiguration(key: string, value: any) {
        let change = [];
        change[key] = value;
        this.updateConfiguration(change);
    }

    updateConfiguration(change) {
        // Check the change type, coerce values
        if (change != null) {
            let config = this.ngRedux.getState().config;

            // Check to see if any values have changed
            let has_changes: boolean = false;
            for (let in_key in change) {
                let value_changed = true;
                if (config.hasOwnProperty(in_key)) {
                    let existing_value = config[in_key];
                    value_changed = change[in_key] != existing_value;
                }

                if (value_changed) {
                    console.log("CHANGE:", change);
                    has_changes = true;
                    break;
                }
            }

            if (has_changes) {
                this.ngRedux.dispatch({
                    type: ConfigurationActions.UPDATE_CONFIG_KEYVALUE,
                    payload: change
                });
            }
        }
    }

    setNotConnecting() {
        this.setConfiguration('homeLanConnecting', false);
    }
}

