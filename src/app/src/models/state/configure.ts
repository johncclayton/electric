import {createLogger} from 'redux-logger';
import {NgRedux} from "@angular-redux/store";

import ChargerAppState from "./state";
import rootReducer from "./reducers";


export const configureAppStateStore = (ngRedux: NgRedux<ChargerAppState>) => {
    let middleware = [createLogger()];
    ngRedux.configureStore(rootReducer, {}, middleware);

};

