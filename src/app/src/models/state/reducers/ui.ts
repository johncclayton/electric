import {AnyAction, Reducer} from "redux";
import {UIActions} from "../actions/ui";

export interface IUIState {
    exception: string;
}

let defaultUIState: IUIState = {
    exception: ""
};

export const
    uiReducer: Reducer<IUIState> = (state: IUIState, action: AnyAction): IUIState => {
        if (state == null) {
            return defaultUIState;
        }
        switch (action.type) {
            case UIActions.SET_EXCEPTION_MESSAGE:
                return {
                    ...state,
                    exception: action.payload
                };
        }

        return state;
    };