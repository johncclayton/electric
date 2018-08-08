import {NgModule} from '@angular/core';
import {UtilsModule} from '../utils/utils.module';
import {BetterRangeComponent} from './better-range/better-range.component';
import {IonicModule} from '@ionic/angular';
import {CommonModule} from '@angular/common';

@NgModule({
    declarations: [
        BetterRangeComponent,
    ],
    imports: [
        CommonModule,
        IonicModule,
        UtilsModule,
    ],
    exports: [
        BetterRangeComponent,
    ]
})
export class ComponentsModule {
}
