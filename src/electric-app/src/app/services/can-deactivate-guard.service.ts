import {Injectable} from '@angular/core';
import {CanDeactivate} from '@angular/router';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router/src/router_state';
import {from, Observable} from 'rxjs';

export interface ICanDeactivate {
    canDeactivate(): Observable<boolean>;
}

@Injectable({
    providedIn: 'root'
})
export class CanDeactivateGuardService implements CanDeactivate<ICanDeactivate> {
    constructor() {
    }

    canDeactivate(component: ICanDeactivate, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState?: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        if(component) {
            console.log(`Component: ${component ? component.constructor.name : 'null'}`);
            console.log(`ARS: ${currentRoute.component.constructor.name}`);

            return component.canDeactivate();
        }
        return true;
    }
}
