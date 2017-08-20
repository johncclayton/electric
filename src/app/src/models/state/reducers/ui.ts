import {AnyAction, Reducer} from "redux";
import {UIActions} from "../actions/ui";
import {error} from "util";

export interface IUIState {
    exception: string;
    details: string;
    disconnected: boolean;
    disconnectionErrorCount: number;
}

let defaultUIState: IUIState = {
    exception: null,
    details: null,
    disconnected: true,
    disconnectionErrorCount: 0,
};

export const
    uiReducer: Reducer<IUIState> = (state: IUIState, action: AnyAction): IUIState => {
        if (state == null) {
            return defaultUIState;
        }

        switch (action.type) {
            case UIActions.SERVER_RECONNECTED:
                return {
                    ...defaultUIState,
                    disconnected: false,
                    disconnectionErrorCount: 0
                };

            case UIActions.SERVER_DISCONNECTED:
                let nextErrorCount = state.disconnectionErrorCount + 1;
                return {
                    ...defaultUIState,
                    disconnected: true,
                    disconnectionErrorCount: nextErrorCount
                };

            case UIActions.SET_EXCEPTION_FROM_ERROR:
                let errorObject: Error = action.payload;
                let errorMessage = errorObject.message ? errorObject.message : errorObject.toString();

                let details = [];
                if (errorObject.name) {
                    details.push(name);
                }
                let detail = details.join(", ");

                return {
                    ...state,
                    exception: errorMessage,
                    details: detail
                };


            case UIActions.SET_EXCEPTION_MESSAGE:
                let message = action.payload;
                return {
                    ...state,
                    exception: message,
                    details: null
                };
        }

        return state;
    };