import {NgModule} from "@angular/core";
import {DurationPipe, KeysPipe, ReversePipe, TempPipe} from "./pipes";

@NgModule({
    declarations: [
        KeysPipe,
        ReversePipe,
        TempPipe,
        DurationPipe,
    ],
    exports: [
        KeysPipe,
        ReversePipe,
        TempPipe,
        DurationPipe,
    ]
})

export class UtilsModule {
}
