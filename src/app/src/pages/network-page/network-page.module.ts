import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {NetworkPage} from './network-page';
import {UtilsModule} from "../../utils/utils.module";

@NgModule({
    declarations: [
    ],
    imports: [
        IonicPageModule.forChild(NetworkPage),
        UtilsModule,
    ],
})
export class NetworkPageModule {
}
