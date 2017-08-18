import {Injectable} from "@angular/core";
import {IAppState} from "../configure";
import {NgRedux} from "@angular-redux/store";

@Injectable()
export class SystemActions {
    static FETCH_SYSTEM: string = "FETCH_SYSTEM";
    static START_FETCH: string = "START_FETCH";
    static END_FETCH: string = "END_FETCH";

    constructor(private ngRedux: NgRedux<IAppState>) {
    }

    fetchSystemFromCharger() {
        this.ngRedux.dispatch({
            type: SystemActions.FETCH_SYSTEM
        });
    }

    startFetch() {
        this.ngRedux.dispatch({
            type: SystemActions.START_FETCH
        });
    }

    endFetchAction(systemDict) {
        return {
            type: SystemActions.END_FETCH,
            payload: systemDict
        };
    }

}