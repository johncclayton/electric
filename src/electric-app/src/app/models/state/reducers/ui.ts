import {AnyAction, Reducer} from 'redux';
import {UIActions} from '../actions/ui';

export interface IUIState {
    exception: string;
    errorObject: Error;
    isConfiguringNetwork: boolean,
    disconnected: boolean;
    disconnectionErrorCount: number;
    isSaving: boolean;
}

let defaultUIState: IUIState = {
    exception: null,
    errorObject: null,
    disconnected: true,
    disconnectionErrorCount: 0,
    isConfiguringNetwork: false,
    isSaving: false
};

export const
    uiReducer: Reducer<IUIState> = (state: IUIState, action: AnyAction): IUIState => {
        if (state == null) {
            return defaultUIState;
        }


        switch (action.type) {
            case UIActions.SET_CONFIG_NETWORK:
                return {
                    ...state,
                    isConfiguringNetwork: action.payload
                };

            case UIActions.SET_SAVING:
                return {
                    ...defaultUIState,
                    isSaving: true
                };

            case UIActions.SET_NOTSAVING:
                return {
                    ...defaultUIState,
                    isSaving: false
                };

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
                let payload: Error = action.payload;
                let userMessage = payload['userMessage'];
                let errorObject = payload['error'];

                return {
                    ...state,
                    exception: userMessage,
                    errorObject: errorObject
                };

            case UIActions.SET_EXCEPTION_MESSAGE:
                let message = action.payload;
                return {
                    ...state,
                    exception: message,
                    errorObject: null
                };

            case UIActions.CLEAR_EXCEPTION_MESSAGE:
                return {
                    ...state,
                    exception: null,
                    errorObject: null
                };
        }

        return state;
    };