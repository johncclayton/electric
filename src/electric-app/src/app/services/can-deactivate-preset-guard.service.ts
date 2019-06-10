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
            let componentName = component ? component.constructor.name : "<none>";
            const guardOnlyTheseURLs = component.guardOnlyTheseURLs();
            this.logger.log(`${this.constructor.name}.canDeactivate called for: ${componentName}. Guarding URLs: ${guardOnlyTheseURLs}. Current route: ${currentRoute} going to: ${nextState.url}`);

            if(guardOnlyTheseURLs) {
                if(guardOnlyTheseURLs.includes(nextState.url)) {
                    this.logger.log(`Component: ${componentName} checking via canDeactivate()`);
                    return component.canDeactivate();
                } else {
                    this.logger.debug(`Guard not called as ${nextState.url} not in ${guardOnlyTheseURLs}`);
                }
            } else {
                this.logger.debug(`Guard not called as ${componentName} didn't return any guardURLs`);
                return component.canDeactivate();
            }

        }
        return true;
    }
}

