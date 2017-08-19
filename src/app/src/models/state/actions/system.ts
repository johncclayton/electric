import {Injectable} from "@angular/core";
import {IAppState} from "../configure";
import {NgRedux} from "@angular-redux/store";
import {ISystem} from "../reducers/system";
import {System} from "../../system";
import {iChargerService} from "../../../services/icharger.service";
import {UIActions} from "./ui";
import {Observable} from "rxjs/Observable";

@Injectable()
export class SystemActions {
    static FETCH_SYSTEM: string = "FETCH_SYSTEM";
    static START_FETCH: string = "START_FETCH";
    static END_FETCH: string = "END_FETCH";
    static SAVE_SETTINGS: string = "SAVE_SETTINGS";
    static UPDATE_SETTINGS_VALUE: string = "UPDATE_SETTINGS_VALUE";

    constructor(private ngRedux: NgRedux<IAppState>,
                private uiActions: UIActions,
                private chargerService: iChargerService) {
    }

    fetchSystemFromCharger() {
        this.ngRedux.dispatch({
            type: SystemActions.FETCH_SYSTEM
        });

        this.chargerService.getSystem().subscribe(system => {
            this.ngRedux.dispatch(this.endFetchAction(system));
        }, (error) => {
            this.uiActions.setErrorMessage(error);
        });
    }

    userChangedValue(change) {
        this.ngRedux.dispatch({
            type: SystemActions.UPDATE_SETTINGS_VALUE,
            payload: change
        });
    }

    updateSystemValue(key: string, value: any) {
        let change = [];
        change[key] = value;
        this.userChangedValue(change);
    }

    saveSystemSettings(systemObject: System): Observable<System> {
        return this.chargerService.saveSystem(systemObject);
    }

    startFetch() {
        this.ngRedux.dispatch({
            type: SystemActions.START_FETCH
        });
    }

    endFetchAction(systemObject: System) {
        return {
            type: SystemActions.END_FETCH,
            payload: systemObject
        };
    }

}