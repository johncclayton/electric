import {Injectable} from '@angular/core';
import {Storage} from "@ionic/storage";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

@Injectable()
export class ConfigStoreProvider {
    configurationLoaded : Subject<boolean> = new Subject();

    constructor(public storage: Storage) {

    }

    loadConfiguration(): Observable<any> {
        return Observable.fromPromise(this.storage.get('config'));
    }

    fireLoadedNotification() {
        this.configurationLoaded.next();
        this.configurationLoaded.complete();
    }

    saveConfiguration(config): Observable<any> {
        return Observable.fromPromise(this.storage.set('config', config));
    }
}
