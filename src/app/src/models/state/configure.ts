import {createLogger} from 'redux-logger';
import {NgRedux, DevToolsExtension} from "@angular-redux/store";
import {Channel} from "../channel";
import {combineReducers} from "redux";
import {configReducer, IConfig} from "./config";
import {IStatus, statusReducer} from "./state";
import persistState from 'redux-localstorage';

export interface IChargerAppState {
    channels: Array<Channel>;
    charger_presence: string;
    config: IConfig;
    status: IStatus;
}

let reducers = combineReducers<IChargerAppState>({
    config: configReducer,
    status: statusReducer,
});

let enhancers = [
    persistState('config', {key: 'electric-config'})
];

export const configureAppStateStore = (ngRedux: NgRedux<IChargerAppState>, devTools: DevToolsExtension) => {
    let middleware = [createLogger()];

    if (devTools.isEnabled()) {
        enhancers.push(devTools.enhancer());
    }
    ngRedux.configureStore(reducers, <IChargerAppState>{}, middleware, enhancers);

};

