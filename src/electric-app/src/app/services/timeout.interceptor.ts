import {Inject, Injectable, InjectionToken} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {timeout} from 'rxjs/operators';

export const TIMEOUT_INTERCEPTOR_DEFAULT_TIMEOUT_TOKEN = new InjectionToken<number>('timeoutInterceptorDefaultTimeout');
export const timeoutInterceptorDefaultTimeout = 10000;

@Injectable({
    providedIn: 'root'
})
export class TimeoutInterceptor implements HttpInterceptor {
    constructor(@Inject(TIMEOUT_INTERCEPTOR_DEFAULT_TIMEOUT_TOKEN) protected defaultTimeout) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const timeoutMs = Number(req.headers.get('timeout')) || this.defaultTimeout;
        return next.handle(req).pipe(timeout(timeoutMs));
    }
}