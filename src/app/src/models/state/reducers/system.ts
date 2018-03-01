import {System} from "../../system";
import {AnyAction, Reducer} from "redux";
import {SystemActions} from "../actions/system";

export interface IChargerCaseFan {
    control: boolean;
    running: boolean;
    threshold: number;
    hysteresis: number;
    gpio: number;
}


export interface ISystem {
    fetching: boolean;
    system: System;
    case_fan: IChargerCaseFan;
}


let defaultSystemState: ISystem = {
    fetching: false,
    case_fan: {
        control: false,
        running: false,
        threshold: 37,
        hysteresis: 3,
        gpio: 23
    },
    system: new System({
        temp_unit: 'C'
    }),
};


export const
    systemReducer: Reducer<ISystem> = (state: ISystem = defaultSystemState, action: AnyAction): ISystem => {
        switch (action.type) {
            case SystemActions.START_FETCH:
            case SystemActions.FETCH_SYSTEM:
                return {
                    ...state,
                    fetching: true
                };

            case SystemActions.UPDATE_CASE_FAN:
                let newCaseFan = {
                    ...state.case_fan,
                    ...action.payload
                };
                return {
                    ...state,
                    case_fan: newCaseFan
                };

            case SystemActions.UPDATE_SETTINGS_VALUE:
                let newSettings = {
                    ...state.system,
                    ...action.payload
                };
                return {
                    ...state,
                    system: newSettings
                };

            case SystemActions.END_FETCH:
                return {
                    ...state,
                    system: action.payload,
                    fetching: false
                }
        }
        return state;
    };


