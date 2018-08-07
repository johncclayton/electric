import {Injectable} from '@angular/core';
import {from, Observable, Subject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConfigStoreService {
    configurationLoaded: Subject<boolean> = new Subject();

    constructor(public storage: Storage) {

    }

    loadConfiguration(): Observable<any> {
        return from(this.storage.get('config'));
    }

    fireLoadedNotification() {
        this.configurationLoaded.next();
        this.configurationLoaded.complete();
    }

    saveConfiguration(config): Observable<any> {
        return from(this.storage.set('config', config));
    }
}
