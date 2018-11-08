import {NgModule} from '@angular/core';
import {DurationPipe, KeysPipe, ReversePipe, TempPipe} from './pipes';
import {StepStateDirective} from './step-state-directive';

@NgModule({
    declarations: [
        KeysPipe,
        ReversePipe,
        TempPipe,
        DurationPipe,
        StepStateDirective,
    ],
    exports: [
        KeysPipe,
        ReversePipe,
        TempPipe,
        DurationPipe,
        StepStateDirective,
    ]
})

export class UtilsModule {
}
