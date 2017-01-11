import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app.module';
let prodMode: boolean = true;//!!window.cordova;

platformBrowserDynamic().bootstrapModule(AppModule);
// platformBrowserDynamic().bootstrapModule(AppModule, [], {prodMode: prodMode});
