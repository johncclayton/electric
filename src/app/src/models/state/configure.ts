import {createLogger} from 'redux-logger';
import {DevToolsExtension, NgRedux} from "@angular-redux/store";
import {combineReducers} from "redux";
import {configReducer, IConfig} from "./reducers/configuration";
import {IChargerState, statusReducer} from "./reducers/charger";
import {IUIState, uiReducer} from "./reducers/ui";
import {ChargerActions} from "./actions/charger";

export interface IAppState {
    config: IConfig;
    charger: IChargerState;
    ui: IUIState
}

let reducers = combineReducers<IAppState>({
    config: configReducer,
    charger: statusReducer,
    ui: uiReducer,
});

let enhancers = [];

export const configureAppStateStore = (ngRedux: NgRedux<IAppState>, devTools: DevToolsExtension) => {
    let middleware = [createLogger({
        predicate: (getState, action) => {
            // Don't show UPDATE charger actions
            return action.type !== ChargerActions.UPDATE_STATE_FROM_CHARGER;
        }
    })];

    if (devTools.isEnabled()) {
        let options = {
            actionsBlacklist: [ChargerActions.UPDATE_STATE_FROM_CHARGER]
        };
        enhancers.push(devTools.enhancer(options));
    }
    ngRedux.configureStore(reducers, <IAppState>{}, middleware, enhancers);

};

