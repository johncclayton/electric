import {Injectable} from "@angular/core";
import {ConfigStoreProvider} from "../../../providers/config-store/config-store";
import {ConfigurationActions} from "../actions/configuration";
import {NgRedux} from "@angular-redux/store";
import {IAppState} from "../configure";

@Injectable()
export class ConfigurationEpics {
    constructor(private configStore: ConfigStoreProvider,
                private ngRedux: NgRedux<IAppState>) {

    }

    configChanged = (action$) => {
        return action$.ofType(
            ConfigurationActions.UPDATE_CONFIG_KEYVALUE,
            ConfigurationActions.UPDATE_CHARGE_CONFIG_KEYVALUE,
            ConfigurationActions.RESET_TO_DEFAULTS,
        )
            .debounceTime(1000)
            .mergeMap((payload) => {
            let config = this.ngRedux.getState()['config'];
            return this.configStore.saveConfiguration(config).map(r => {
                return {
                    type: ConfigurationActions.CONFIG_SAVED_TO_STORE,
                }
            });
        });
    }
}