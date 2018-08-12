import {Injectable} from '@angular/core';
import {IAppState} from '../configure';
import {NgRedux} from '@angular-redux/store';
import {System} from '../../system';
import {iChargerService} from '../../../services/icharger.service';
import {UIActions} from './ui';
import {compareTwoMaps} from '../../../utils/helpers';
import {ISystem} from '../reducers/system';
import {concat, forkJoin, interval, Observable, throwError} from 'rxjs';
import {catchError, filter, last, map} from 'rxjs/operators';
import {CaseFanService} from '../../../services/case-fan.service';

@Injectable({
    providedIn: 'root'
})
export class SystemActions {
    static FETCH_SYSTEM: string = 'FETCH_SYSTEM';
    static START_FETCH: string = 'START_FETCH';
    static END_FETCH: string = 'END_FETCH';
    static SAVE_SETTINGS: string = 'SAVE_SETTINGS';
    static UPDATE_SETTINGS_VALUE: string = 'UPDATE_SETTINGS_VALUE';
    static FETCH_CASE_FAN: string = 'FETCH_CASE_FAN';
    static UPDATE_CASE_FAN: string = 'UPDATE_CASE_FAN';

    constructor(
        private ngRedux: NgRedux<IAppState>,
        private caseFan: CaseFanService,
        private chargerService: iChargerService,
        private uiActions: UIActions
    ) {
    }

    fetchSystemFromCharger(callback = null) {
        this.ngRedux.dispatch({
            type: SystemActions.FETCH_SYSTEM
        });

        let chargerService = this.chargerService;
        if (chargerService) {
            let system_request = chargerService.getSystem();
            let case_request = this.caseFan.getCaseFan();

            let waitingForConnected = this.chargerService.waitForChargerConnected();
            let statusOperations = forkJoin(
                system_request,
                case_request
            );

            concat(waitingForConnected, statusOperations)
                .pipe(last())
                .subscribe(v => {
                    // We get a LIST of responses.
                    // The case_fan response is dispatched to redux by the getCaseFan call.
                    let system_object = v[0] as System;
                    let case_fan_info = v[1];
                    this.updateCaseFan(case_fan_info);
                    this.ngRedux.dispatch(this.endFetchAction(system_object));
                    if (callback) {
                        callback();
                    }
                }, (error) => {
                    this.uiActions.setErrorMessage(error);
                }, () => {
                    console.error('fetchSystemFromCharger complete');
                });
        }
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

    saveSystemSettings(systemObject: ISystem): Observable<ISystem> {
        let sysValues = systemObject.system;
        if (sysValues.has_case_fan) {
            let fanValues = systemObject.case_fan;
            this.caseFan.saveCaseFan(fanValues).subscribe();
        }

        return this.chargerService.saveSystem(sysValues)
            .pipe(
                map(() => {
                    this.ngRedux.dispatch(this.endFetchAction(sysValues));
                    return systemObject;
                }),
                catchError((error) => {
                    console.error(error);
                    return throwError(error);
                })
            );
    }

    startFetch() {
        this.ngRedux.dispatch({
            type: SystemActions.START_FETCH
        });
    }

    // noinspection JSMethodCanBeStatic
    endFetchAction(systemObject: System, callback = null) {
        return {
            type: SystemActions.END_FETCH,
            payload: systemObject,
        };
    }

    updateCaseFan(case_fan_state: any) {
        // console.log(`See case fan state: ${JSON.stringify(case_fan_state)}`);
        let existing = this.ngRedux.getState().system.case_fan;
        let comparison_result = compareTwoMaps(existing, case_fan_state);
        if (comparison_result.length > 0) {
            console.log('Case fan state differs: ' + comparison_result.join(', '));
            this.ngRedux.dispatch({
                type: SystemActions.UPDATE_CASE_FAN,
                payload: case_fan_state
            });
        }
    }
}