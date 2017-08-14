import {Injectable} from "@angular/core";
import {IAppState} from "../configure";
import {NgRedux} from "@angular-redux/store";
import {iChargerService} from "../../../services/icharger.service";
import {ConfigStoreProvider} from "../../../providers/config-store/config-store";
import {UIActions} from "./ui";


@Injectable()
export class ConfigurationActions {
    static RESET_TO_DEFAULTS: string = 'RESET_TO_DEFAULTS';
    static UPDATE_CONFIG_KEYVALUE: string = 'UPDATE_CONFIG_KEYVALUE';
    static CONFIG_SAVED_TO_STORE: string = 'CONFIG_SAVED_TO_STORE';
    static SET_FULL_CONFIG: string = 'SET_FULL_CONFIG';

    constructor(private ngRedux: NgRedux<IAppState>,
                private configStore: ConfigStoreProvider,
                private uiActions: UIActions,
                private chargerService: iChargerService) {
    }

    updateStateFromChargerAsync() {
        this.chargerService.getSystem().subscribe((system) => {
            console.info("Updating config with values from charger...");
            this.setConfiguration("unitsCelsius", system.isCelsius);
        }, (error) => {
            this.uiActions.setErrorMessage(error);
        });
    }


    toggleCelsiusAsync(enabled) {
        console.log("Me should try to change temp units");

        this.chargerService.toggleChargerTempUnits().subscribe((system) => {
            // it worked, update state
            console.log("Done, using C: " + system.isCelsius + ", saving state ...");
            this.setConfiguration("unitsCelsius", system.isCelsius);
        }, (error) => {
            // it failed, update state
            this.uiActions.setErrorMessage(error);
        });
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

