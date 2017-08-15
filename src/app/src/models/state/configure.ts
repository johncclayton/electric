import {createLogger} from 'redux-logger';
import {DevToolsExtension, NgRedux} from "@angular-redux/store";
import {combineReducers} from "redux";
import {configReducer, IConfig} from "./reducers/configuration";
import {IChargerState, chargerStateReducer} from "./reducers/charger";
import {IUIState, uiReducer} from "./reducers/ui";
import {ChargerActions} from "./actions/charger";
import {ConfigurationEpics} from "./epics/configuration";
import {createEpicMiddleware} from "redux-observable";

export interface IAppState {
    config: IConfig;
    charger: IChargerState;
    ui: IUIState
}

let reducers = combineReducers<IAppState>({
    config: configReducer,
    charger: chargerStateReducer,
    ui: uiReducer,
});

let enhancers = [];

export const configureAppStateStore = (ngRedux: NgRedux<IAppState>, configEpic: ConfigurationEpics, devTools: DevToolsExtension) => {
    let actionsBlacklist: Array<string> = [
        ChargerActions.UPDATE_STATE_FROM_CHARGER,
    ];

    // Insert the epic middleware first.
    let middleware = [];
    middleware.push(createEpicMiddleware(configEpic.configChanged));

    // Add logger if in development
    if (process.env.NODE_ENV === `development`) {
        middleware.push(createLogger({
            predicate: (getState, action) => {
                // Don't show certain charger actions
                return actionsBlacklist.indexOf(action.type) == -1;
            }
        }));
    }

    if (window.navigator.userAgent.includes('Chrome')) {
        if (devTools.isEnabled()) {
            // Don't show certain charger actions
            let options = {
                actionsBlacklist: actionsBlacklist
            };
            enhancers.push(devTools.enhancer(options));
        }
    }
    ngRedux.configureStore(reducers, <IAppState>{}, middleware, enhancers);

};

