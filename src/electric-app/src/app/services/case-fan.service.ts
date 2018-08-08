import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {IChargerCaseFan} from '../models/system';
import {map} from 'rxjs/operators';
import {URLService} from './url.service';
import {SystemActions} from '../models/state/actions/system';
import {HttpClient} from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class CaseFanService {

    constructor(private http: HttpClient, private url: URLService, private systemActions: SystemActions) {
    }

    getCaseFan(): Observable<IChargerCaseFan> {
        let url = this.url.getChargerURL('/casefan');
        return this.http.get(url).pipe(
            map(r => {
                // Map this into the system 'case fan' state.
                this.systemActions.updateCaseFan(r);
                return r as IChargerCaseFan;
            })
        );
    }

    saveCaseFan(case_fan: IChargerCaseFan): Observable<IChargerCaseFan> {
        let operationURL = this.url.getChargerURL('/casefan');
        return this.http.put(operationURL, case_fan).pipe(
            map(r => {
                return r as IChargerCaseFan;
            })
        );
    }

}
