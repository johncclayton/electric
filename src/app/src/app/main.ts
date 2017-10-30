import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {enableProdMode} from "@angular/core";

import {AppModule} from './app.module';
import {System} from "../models/system";

// import 'web-animations-js/web-animations.min';

let envVars = System.environment.ionicEnvName;
console.log("Running in " + envVars.ionicEnvName + " mode");
if (envVars.ionicEnvName == 'prod') {
    // this is the magic wand of speed
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
