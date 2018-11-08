import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';

import {IonicModule} from '@ionic/angular';

import {NetworkWizardPage} from './network-wizard.page';
import {ComponentsModule} from '../../components/components.module';
import {UtilsModule} from '../../utils/utils.module';

const routes: Routes = [
    {
        path: '',
        component: NetworkWizardPage
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ComponentsModule,
        UtilsModule,
        RouterModule.forChild(routes)
    ],
    declarations: [NetworkWizardPage]
})
export class NetworkWizardPageModule {
}
