import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class DataBagService {
    theData: Map<any, any>;

    constructor() {
    }

    set(key, value) {
        this.theData.set(key, value);
    }

    get(key): any {
        return this.theData.get(key);
    }
}
