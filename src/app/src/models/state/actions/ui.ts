import {Injectable} from "@angular/core";
import {IAppState} from "../configure";
import {NgRedux} from "@angular-redux/store";

@Injectable()
export class UIActions {
    static SET_EXCEPTION_MESSAGE: string = "SET_EXCEPTION_MESSAGE";

    constructor(private ngRedux: NgRedux<IAppState>) {
    }

    setErrorMessage(error: string) {
        if (!error) {
            console.log("setErrorMessage called with nothing");
            return;
        }
        this.ngRedux.dispatch({
            type: UIActions.SET_EXCEPTION_MESSAGE,
            payload: error
        });
    }

    setErrorFromException(error: Error) {
        if (!error) {
            console.log("setErrorFromException called with nothing");
            return;
        }
        let message = error.message ? error.message : error.toString();
        this.ngRedux.dispatch({
            type: UIActions.SET_EXCEPTION_MESSAGE,
            payload: message
        });
    }

    setErrorFromResponse(response: Response) {
        if (!response) {
            console.log("setErrorFromResponse called with nothing");
            return;
        }
        let message = response.statusText ? response.statusText : "Code: " + response.status;
        this.ngRedux.dispatch({
            type: UIActions.SET_EXCEPTION_MESSAGE,
            payload: message
        });
    }
}
