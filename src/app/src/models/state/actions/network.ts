import {Injectable} from "@angular/core";
import {IAppState} from "../configure";
import {NgRedux} from "@angular-redux/store";

@Injectable()
export class NetworkActions {
    static UPDATE_FROM_STATUS_SERVER:string = "UPDATE_FROM_STATUS_SERVER";
    static UPDATE_WIFI_DETAILS:string = "UPDATE_WIFI_DETAILS";

    constructor(private ngRedux: NgRedux<IAppState>) {
    }

}

