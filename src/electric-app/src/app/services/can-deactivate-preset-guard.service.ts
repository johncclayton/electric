import {Injectable} from '@angular/core';
import {CanActivate, CanDeactivate} from '@angular/router';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router/src/router_state';
import {Observable} from 'rxjs';
import {CustomNGXLoggerService, NGXLogger, NgxLoggerLevel} from 'ngx-logger';

export interface ICanDeactivate {
    canDeactivate(): Observable<boolean>;
    guardOnlyTheseURLs():Array<string> | null;
}

@Injectable({
    providedIn: 'root'
})
export class GenericDeactivateGuard implements CanDeactivate<ICanDeactivate> {
    public logger: NGXLogger;

    constructor(private logSvc: CustomNGXLoggerService) {
        this.logger = logSvc.create({level: NgxLoggerLevel.INFO});
    }

    canDeactivate(component: ICanDeactivate, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState?: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        // this.logger.log(`Current state: ${currentState}`);
        // this.logger.log(`Next state: ${nextState}`);

        if (component) {
            this.logger.log(`${this.constructor.name}.canDeactivate called for: ${component}, current route: ${currentRoute} going to: ${nextState.url}`);

            const guardOnlyTheseURLs = component.guardOnlyTheseURLs();
            if(guardOnlyTheseURLs) {
                if(nextState.url in guardOnlyTheseURLs) {
                    this.logger.log(`Component: ${component ? component.constructor.name : 'null'} checking via canDeactivate()`);
                    return component.canDeactivate();
                }
            } else {
                return component.canDeactivate();
            }

        }
        return true;
    }
}

