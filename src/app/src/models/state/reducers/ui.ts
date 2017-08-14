import {AnyAction, Reducer} from "redux";
import {UIActions} from "../actions/ui";

export interface IUIState {
    exception: string;
}

export const
    uiReducer: Reducer<IUIState> = (state: IUIState, action: AnyAction): IUIState => {
        switch (action.type) {
            case UIActions.SET_EXCEPTION_MESSAGE:
                return action.payload;
        }

        return {
            exception: ""
        };
    };