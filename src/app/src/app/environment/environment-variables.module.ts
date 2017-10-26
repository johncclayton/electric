import {NgModule} from '@angular/core';
import {EnvVariables} from './environment-variables.token';
import {devVariables} from './development';
import {prodVariables} from './production';
import {qaVariables} from './qa';

declare const process: any; // Typescript compiler will complain without this

export function environmentFactory() {
    // console.log("process.env.IONIC_ENV = " + process.env.IONIC_ENV);
    return process.env.IONIC_ENV === 'dev' ? devVariables : prodVariables;
}

@NgModule({
    providers: [
        {
            provide: EnvVariables,
            // useFactory instead of useValue so we can easily add more logic as needed.
            useFactory: environmentFactory
        }
    ]
})
export class EnvironmentsModule {
}