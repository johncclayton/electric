import {createLogger} from 'redux-logger';
import {NgRedux} from "@angular-redux/store";
import {Channel} from "../channel";
import {combineReducers} from "redux";
import {configReducer, IConfig} from "./config";
import {IStatus, statusReducer} from "./state";

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

export const configureAppStateStore = (ngRedux: NgRedux<IChargerAppState>) => {
    let middleware = [createLogger()];
    ngRedux.configureStore(reducers, <IChargerAppState>{}, middleware);

};

