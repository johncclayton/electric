import {Injectable} from "@angular/core";
import {IChargerAppState} from "./configure";
import {NgRedux} from "@angular-redux/store";
import {iChargerService} from "../../services/icharger.service";


@Injectable()
export class ConfigurationActions {
    constructor(private ngRedux: NgRedux<IChargerAppState>, private chargerService: iChargerService) {
    }

    static TOGGLE_CELSIUS: string = 'TOGGLE_CELSIUS';
    static RESET_TO_DEFAULTS: string = 'RESET_TI_DEFAULTS';

    toggleCelsius() {
        console.log("Me should try to change temp units");

        this.chargerService.toggleChargerTempUnits().subscribe((system) => {
            // it worked, update state
        }, (error) => {
            // it failed, update state
        });
    }

    resetToDefaults() {
        this.ngRedux.dispatch({
            type: ConfigurationActions.RESET_TO_DEFAULTS,
            payload: {}
        });
    }
}


export const ACTION_PROVIDERS = [
    ConfigurationActions
];
