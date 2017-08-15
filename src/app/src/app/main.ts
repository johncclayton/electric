import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {enableProdMode} from "@angular/core";

import {AppModule} from './app.module';
import {environmentFactory} from "./environment/environment-variables.module";

// this is the magic wand of speed
let envVars = environmentFactory();
console.log("Running in " + envVars.ionicEnvName + " mode");
if (envVars.ionicEnvName == 'prod') {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
