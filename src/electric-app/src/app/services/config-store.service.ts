import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage';
import {from, Observable, ReplaySubject, Subject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConfigStoreService {
    configurationLoaded$: Subject<any> = new ReplaySubject(1);

    constructor(public storage: Storage) {

    }

    loadConfiguration() {
        const observable = from(this.storage.get('config'));
        observable.subscribe(this.configurationLoaded$);
    }

    saveConfiguration(config): Observable<any> {
        return from(this.storage.set('config', config));
    }
}
