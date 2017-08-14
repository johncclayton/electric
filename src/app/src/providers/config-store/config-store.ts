import {Injectable} from '@angular/core';
import {Storage} from "@ionic/storage";
import {Observable} from "rxjs/Observable";

@Injectable()
export class ConfigStoreProvider {

    constructor(public storage: Storage) {
    }

    loadConfiguration(): Observable<any> {
        return Observable.fromPromise(this.storage.get('config'));
    }

    saveConfiguration(config): Observable<any> {
        console.log("Storing " + config + " to Ionic storage");
        return Observable.fromPromise(this.storage.set('config', config));
    }
}
