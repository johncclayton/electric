import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {IChargerCaseFan} from '../models/system';
import {map} from 'rxjs/operators';
import {URLService} from './url.service';
import {HttpClient} from '@angular/common/http';
import {CustomNGXLoggerService, NGXLogger, NgxLoggerLevel} from 'ngx-logger';

@Injectable({
    providedIn: 'root'
})
export class CaseFanService {
    private logger: NGXLogger;

    constructor(private http: HttpClient,
                private loggerSvc: CustomNGXLoggerService,
                private url: URLService) {
        this.logger = this.loggerSvc.create({level: NgxLoggerLevel.INFO});
    }

    getCaseFan(): Observable<IChargerCaseFan> {
        let url = this.url.getChargerURL('/casefan');
        // this.logger.info(`Getting casefan state from ${url}...`);
        return this.http.get(url).pipe(
            map(r => {
                // Map this into the system 'case fan' state.
                // this.logger.info(`Casefan is: ${JSON.stringify(r)}`);
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
