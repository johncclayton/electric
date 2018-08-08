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
import {HttpClientModule} from '@angular/common/http';
import {IonicStorageModule} from '@ionic/storage';
import {UtilsModule} from './utils/utils.module';
import {ComponentsModule} from './components/components.module';
import {Zeroconf} from '@ionic-native/zeroconf/ngx';

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
        ComponentsModule
    ],
    providers: [
        StatusBar,
        SplashScreen,
        LocalNotifications,
        Zeroconf,
        Vibration,
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy}
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
