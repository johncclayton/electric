import {Injectable} from '@angular/core';
import {ConfigurationActions} from '../actions/configuration';
import {NgRedux} from '@angular-redux/store';
import {IAppState} from '../configure';
import {ConfigStoreService} from '../../../services/config-store.service';
import {debounceTime, map, mergeMap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {Action} from 'redux';

@Injectable({
    providedIn: 'root'
})
export class ConfigurationEpics {
    constructor(private configStore: ConfigStoreService,
                private ngRedux: NgRedux<IAppState>) {

    }

    configChanged = (action$): Observable<Action> => {
        return action$.ofType(
            ConfigurationActions.UPDATE_CONFIG_KEYVALUE,
            ConfigurationActions.UPDATE_CHARGE_CONFIG_KEYVALUE,
            ConfigurationActions.RESET_TO_DEFAULTS,
        ).pipe(
            debounceTime(1000),
            mergeMap(payload => {
                let config = this.ngRedux.getState()['config'];
                return this.configStore.saveConfiguration(config).pipe(
                    map(r => {
                        return {
                            type: ConfigurationActions.CONFIG_SAVED_TO_STORE,
                        };
                    })
                );
            })
        );
    };
}