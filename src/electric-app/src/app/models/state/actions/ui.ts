import {Injectable} from "@angular/core";
import {IAppState} from "../configure";
import {NgRedux} from "@angular-redux/store";

@Injectable({
    providedIn: 'root'
})
export class UIActions {
    static SET_EXCEPTION_MESSAGE: string = "SET_EXCEPTION_MESSAGE";
    static SET_CONFIG_NETWORK: string = "SET_CONFIG_NETWORK";
    static SET_EXCEPTION_FROM_ERROR: string = "SET_EXCEPTION_FROM_ERROR";

    static SERVER_DISCONNECTED: string = "SERVER_DISCONNECTED";
    static SERVER_RECONNECTED: string = "SERVER_RECONNECTED";

    constructor(private ngRedux: NgRedux<IAppState>) {
    }

    setErrorMessage(error: string) {
        if (!error) {
            console.log("setErrorMessage called with nothing");
            return;
        }
        this.ngRedux.dispatch({
            type: UIActions.SET_EXCEPTION_MESSAGE,
            payload: error,
        });
    }

    setErrorFromException(error: Error) {
        if (!error) {
            console.log("setErrorFromException called with nothing");
            return;
        }
        this.ngRedux.dispatch({
            type: UIActions.SET_EXCEPTION_FROM_ERROR,
            payload: error,
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
            payload: message,
        });
    }

    setDisconnected() {
        this.ngRedux.dispatch({
            type: UIActions.SERVER_DISCONNECTED
        });
    }

    serverReconnected() {
        this.ngRedux.dispatch({
            type: UIActions.SERVER_RECONNECTED
        });
    }

    setConfiguringNetwork(new_value: boolean) {
        this.ngRedux.dispatch({
            type: UIActions.SET_CONFIG_NETWORK,
            payload: new_value
        })
    }
}
