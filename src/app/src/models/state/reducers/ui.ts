import {AnyAction, Reducer} from "redux";
import {UIActions} from "../actions/ui";

export interface IUIState {
    exception: string;
}

let defaultUIState: IUIState = {
    exception: null
};

export const
    uiReducer: Reducer<IUIState> = (state: IUIState, action: AnyAction): IUIState => {
        if (state == null) {
            return defaultUIState;
        }
        switch (action.type) {
            case UIActions.SET_EXCEPTION_MESSAGE:
                let message = action.payload;
                return {
                    ...state,
                    exception: message
                };
        }

        return state;
    };