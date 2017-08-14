import {Injectable} from "@angular/core";
import {IChargerAppState} from "./configure";
import {NgRedux} from "@angular-redux/store";
import {iChargerService} from "../../services/icharger.service";
import {ConfigStoreProvider} from "../../providers/config-store/config-store";
import {IConfig} from "./config";


@Injectable()
export class ConfigurationActions {
    static RESET_TO_DEFAULTS: string = 'RESET_TO_DEFAULTS';
    static UPDATE_CONFIG_KEYVALUE: string = 'UPDATE_CONFIG_KEYVALUE';
    static SET_CONFIG: string = 'SET_CONFIG';
    static SAVE_CONFIG: string = 'SAVE_CONFIG';

    constructor(private ngRedux: NgRedux<IChargerAppState>,
                private configStore: ConfigStoreProvider,
                private chargerService: iChargerService) {

        this.configStore.loadConfiguration().subscribe(r => {
            console.log("Configuration loaded, putting into the store...");
            this.ngRedux.dispatch({
                type: ConfigurationActions.SET_CONFIG,
                payload: r
            })
        });
    }

    toggleCelsius(enabled) {
        console.log("Me should try to change temp units");

        this.chargerService.toggleChargerTempUnits().subscribe((system) => {
            // it worked, update state
            console.log("Done, saving state ...");
            this.updateConfiguration({'useCelsius': system.isCelsius})
        }, (error) => {
            // it failed, update state

        });
    }

    resetToDefaults() {
        this.ngRedux.dispatch({
            type: ConfigurationActions.RESET_TO_DEFAULTS,
            payload: {}
        });
        this.saveConfig();
    }

    updateConfiguration(change) {
        // Check the change type, coerce values
        if (change) {
            this.ngRedux.dispatch({
                type: ConfigurationActions.UPDATE_CONFIG_KEYVALUE,
                payload: change
            });
            this.saveConfig();
        }
    }

    saveConfig() {
        let config = this.ngRedux.getState()['config'];
        this.configStore.saveConfiguration(config).subscribe(r => {
            console.log("Configuration saved");
        });

        this.ngRedux.dispatch({
            type: ConfigurationActions.SAVE_CONFIG
        });
    }
}

