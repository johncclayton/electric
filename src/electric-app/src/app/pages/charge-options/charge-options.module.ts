import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';

import {IonicModule} from '@ionic/angular';

import {ChargeOptionsPage} from './charge-options.page';

const routes: Routes = [
    {
        path: '',
        component: ChargeOptionsPage
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes)
    ],
    declarations: [ChargeOptionsPage]
})
export class ChargeOptionsPageModule {
}
