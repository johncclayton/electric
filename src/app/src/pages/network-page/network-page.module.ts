import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {NetworkPage} from './network-page';
import {UtilsModule} from "../../utils/utils.module";
import {NetworkWizHomePage} from "../network-wiz-home/network-wiz-home";
import {NetworkWizardModule} from "../wizard/network-wizard.module";

@NgModule({
    declarations: [],
    entryComponents: [],
    imports: [
        IonicPageModule.forChild(NetworkPage),
        UtilsModule,
    ],
})
export class NetworkPageModule {
}
