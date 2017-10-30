import {createLogger} from 'redux-logger';
import {DevToolsExtension, NgRedux} from "@angular-redux/store";
import {combineReducers} from "redux";
import {configReducer, IConfig} from "./reducers/configuration";
import {chargerStateReducer, IChargerState} from "./reducers/charger";
import {IUIState, uiReducer} from "./reducers/ui";
import {ChargerActions} from "./actions/charger";
import {ConfigurationEpics} from "./epics/configuration";
import {combineEpics, createEpicMiddleware} from "redux-observable";
import {ISystem, systemReducer} from "./reducers/system";
import {System} from "../system";

export interface IAppState {
    config: IConfig;
    charger: IChargerState;
    system: ISystem;
    ui: IUIState
}

let reducers = combineReducers<IAppState>({
    config: configReducer,
    charger: chargerStateReducer,
    system: systemReducer,
    ui: uiReducer,
});

let enhancers = [];

export const configureAppStateStore = (ngRedux: NgRedux<IAppState>,
                                       configEpic: ConfigurationEpics,
                                       devTools: DevToolsExtension) => {
        let actionsBlacklist: Array<string> = [
            ChargerActions.UPDATE_STATE_FROM_CHARGER,
        ];

        // Insert the epic middleware first.
        let middleware = [];
        middleware.push(createEpicMiddleware(
            combineEpics(
                configEpic.configChanged,
            )
            )
        );

        // Add logger if in development (web browsers)

        if (System.environment.logging) {
            console.log("Adding in state logging...");
            middleware.push(createLogger({
                predicate: (getState, action) => {
                    // Don't show certain charger actions
                    return actionsBlacklist.indexOf(action.type) == -1;
                }
            }));
        }

        if (System.environment.ionicEnvName == "dev") {
            if (window.navigator.userAgent.includes('Chrome')) {
                console.log("Adding in chrome redux devtools ...");
                if (devTools.isEnabled()) {
                    // Don't show certain charger actions
                    let options = {
                        actionsBlacklist: actionsBlacklist
                    };
                    enhancers.push(devTools.enhancer(options));
                }
            }
        }

        ngRedux.configureStore(reducers, <IAppState>{}, middleware, enhancers);

    }
;

