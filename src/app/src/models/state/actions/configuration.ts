import {Injectable} from "@angular/core";
import {IAppState} from "../configure";
import {NgRedux} from "@angular-redux/store";
import {iChargerService} from "../../../services/icharger.service";


@Injectable()
export class ConfigurationActions {
    static RESET_TO_DEFAULTS: string = 'RESET_TO_DEFAULTS';
    static UPDATE_CONFIG_KEYVALUE: string = 'UPDATE_CONFIG_KEYVALUE';
    static UPDATE_CHARGE_CONFIG_KEYVALUE: string = 'UPDATE_CHARGE_CONFIG_KEYVALUE';
    static CONFIG_SAVED_TO_STORE: string = 'CONFIG_SAVED_TO_STORE';
    static SET_FULL_CONFIG: string = 'SET_FULL_CONFIG';

    constructor(private ngRedux: NgRedux<IAppState>,
                private chargerService: iChargerService) {
    }

    resetToDefaults() {
        this.ngRedux.dispatch({
            type: ConfigurationActions.RESET_TO_DEFAULTS,
            payload: {}
        });
    }

    setConfiguration(key: string, value: any) {
        let change = [];
        change[key] = value;
        this.updateConfiguration(change);
    }

    setChargeConfiguration(key: string, value: any) {
        let change = [];
        change[key] = value;
        this.ngRedux.dispatch({
            type: ConfigurationActions.UPDATE_CHARGE_CONFIG_KEYVALUE,
            payload: change,
            maxAmpsPerChannel: this.chargerService.getMaxAmpsPerChannel()
        });
    }

    updateConfiguration(change) {
        // Check the change type, coerce values
        if (change) {
            let config = this.ngRedux.getState().config;
            let key = Object.keys(change)[0];
            if (config[key] != change[key]) {
                this.ngRedux.dispatch({
                    type: ConfigurationActions.UPDATE_CONFIG_KEYVALUE,
                    payload: change
                });
            }
        }
    }
}

