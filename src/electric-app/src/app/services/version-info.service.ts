import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Subject} from 'rxjs';
import {SWBSafeJSON} from '../utils/safe-json';

@Injectable({
    providedIn: 'root'
})
export class VersionInfoService {
    version: string = '0.0.0';
    build: string = '0';
    environment: string = 'unknown';

    ready: boolean = false;
    ready$: Subject<boolean>;

    constructor(public http: HttpClient) {
        this.ready$ = new BehaviorSubject<boolean>(false);
        this.http.get('assets/version.json').subscribe(r => {

            console.log(`GOT ${SWBSafeJSON.stringify(r)}`);

            if (r['version']) {
                this.version = r['version'];
            }
            if (r['build']) {
                this.build = r['build'];
            }
            if (r['environment']) {
                this.environment = r['environment'];
            }

            this.ready = true;
            this.ready$.next(true);
        });
    }
}
