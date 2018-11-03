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
export class CanDeactivatePresetGuard implements CanDeactivate<ICanDeactivate> {
    constructor() {
    }

    canDeactivate(component: ICanDeactivate, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState?: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        // console.log(`Current state: ${currentState}`);
        // console.log(`Next state: ${nextState}`);

        if (component) {
            console.log(`CanDeactivateGuardService called for: ${component}, current route: ${currentRoute} going to: ${nextState.url}`);
            if (nextState.url == '/PresetList') {
                console.log(`Component: ${component ? component.constructor.name : 'null'} checking via canDeactivate()`);
                // console.log(`ARS: ${currentRoute.component.constructor.name}`);
                return component.canDeactivate();
            }

        }
        return true;
    }
}
