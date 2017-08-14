import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app.module';

// this is the magic wand of speed
// import {enableProdMode} from "@angular/core";
// enableProdMode();

platformBrowserDynamic().bootstrapModule(AppModule);
