import {Injectable} from '@angular/core';
import {CanDeactivate} from '@angular/router';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router/src/router_state';
import {from, Observable} from 'rxjs';
import {CustomNGXLoggerService, NGXLogger, NgxLoggerLevel} from 'ngx-logger';

export interface ICanDeactivate {
    canDeactivate(): Observable<boolean>;
}

@Injectable({
    providedIn: 'root'
})
export class CanDeactivatePresetGuard implements CanDeactivate<ICanDeactivate> {
    private logger: NGXLogger;
    constructor(private logSvc:CustomNGXLoggerService) {
        this.logger = logSvc.create({level: NgxLoggerLevel.INFO});
    }

    canDeactivate(component: ICanDeactivate, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState?: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        // this.logger.log(`Current state: ${currentState}`);
        // this.logger.log(`Next state: ${nextState}`);

        if (component) {
            this.logger.log(`CanDeactivateGuardService called for: ${component}, current route: ${currentRoute} going to: ${nextState.url}`);
            if (nextState.url == '/PresetList') {
                this.logger.log(`Component: ${component ? component.constructor.name : 'null'} checking via canDeactivate()`);
                // this.logger.log(`ARS: ${currentRoute.component.constructor.name}`);
                return component.canDeactivate();
            }

        }
        return true;
    }
}
