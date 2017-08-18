import {System} from "../../system";
import {AnyAction, Reducer} from "redux";
import {SystemActions} from "../actions/system";

export interface ISystem {
    fetching: boolean;
    system: System;
}

let defaultSystemState: ISystem = {
    fetching: false,
    system: new System({
        'temp_unit': 'C'
    })
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

            case SystemActions.END_FETCH:
                return {
                    ...state,
                    system: action.payload,
                    fetching: false
                }
        }
        return state;
    };


