import {Injectable} from "@angular/core";
import {IAppState} from "../configure";
import {NgRedux} from "@angular-redux/store";
import {ISystem} from "../reducers/system";
import {System} from "../../system";

@Injectable()
export class SystemActions {
    static FETCH_SYSTEM: string = "FETCH_SYSTEM";
    static START_FETCH: string = "START_FETCH";
    static END_FETCH: string = "END_FETCH";
    static SAVE_SETTINGS: string = "SAVE_SETTINGS";

    constructor(private ngRedux: NgRedux<IAppState>) {
    }

    fetchSystemFromCharger() {
        this.ngRedux.dispatch({
            type: SystemActions.FETCH_SYSTEM
        });
    }

    saveSystemSettings(systemObject: ISystem) {
        this.ngRedux.dispatch({
            type: SystemActions.SAVE_SETTINGS,
            payload: systemObject.system
        })
    }

    startFetch() {
        this.ngRedux.dispatch({
            type: SystemActions.START_FETCH
        });
    }

    endFetchAction(systemObject:System) {
        return {
            type: SystemActions.END_FETCH,
            payload: systemObject
        };
    }

}