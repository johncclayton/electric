import {Injectable} from "@angular/core";
import {IAppState} from "../configure";
import {NgRedux} from "@angular-redux/store";

@Injectable()
export class UIActions {
    static SET_EXCEPTION_MESSAGE: string = "SET_EXCEPTION_MESSAGE";

    constructor(private ngRedux: NgRedux<IAppState>) {
    }

    setErrorMessage(error: any) {
        this.ngRedux.dispatch({
            type: UIActions.SET_EXCEPTION_MESSAGE,
            payload: error
        });
    }
}
