import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app.module';
import {enableProdMode} from "@angular/core";

// this is the magic wand of speed
// enableProdMode();

platformBrowserDynamic().bootstrapModule(AppModule);
