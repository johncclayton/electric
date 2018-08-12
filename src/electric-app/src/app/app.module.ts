import {Injector, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';

import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {LocalNotifications} from '@ionic-native/local-notifications/ngx';
import {Vibration} from '@ionic-native/vibration/ngx';
import {ConfigurationEpics} from './models/state/epics/configuration';
import {DevToolsExtension, NgRedux, NgReduxModule} from '@angular-redux/store';
import {configureAppStateStore, IAppState} from './models/state/configure';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {IonicStorageModule} from '@ionic/storage';
import {UtilsModule} from './utils/utils.module';
import {ComponentsModule} from './components/components.module';
import {Zeroconf} from '@ionic-native/zeroconf/ngx';
import {
    TIMEOUT_INTERCEPTOR_DEFAULT_TIMEOUT_TOKEN,
    TimeoutInterceptor,
    timeoutInterceptorDefaultTimeout
} from './services/timeout.interceptor';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';

@NgModule({
    declarations: [
        AppComponent,
    ],
    entryComponents: [],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        IonicStorageModule.forRoot(),
        HttpClientModule,
        UtilsModule,
        NgReduxModule,
        AppRoutingModule,
        ComponentsModule,
        LoggerModule.forRoot({level: NgxLoggerLevel.WARN})
    ],
    providers: [
        StatusBar,
        SplashScreen,
        LocalNotifications,
        Zeroconf,
        Vibration,
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
        {provide: HTTP_INTERCEPTORS, useClass: TimeoutInterceptor, multi: true},
        {provide: TIMEOUT_INTERCEPTOR_DEFAULT_TIMEOUT_TOKEN, useValue: timeoutInterceptorDefaultTimeout},
    ],
    bootstrap: [AppComponent]
})

export class AppModule {
    static injector: Injector;

    constructor(ngRedux: NgRedux<IAppState>,
                devTools: DevToolsExtension,
                configEpic: ConfigurationEpics,
                injector: Injector,
    ) {
        AppModule.injector = injector;
        configureAppStateStore(ngRedux, configEpic, devTools);
    }
}
