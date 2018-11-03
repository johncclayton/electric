import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Routes, RouterModule} from '@angular/router';

import {IonicModule} from '@ionic/angular';

import {PresetChargePage} from './preset-charge.page';
import {CanDeactivatePresetGuard} from '../../services/can-deactivate-preset-guard.service';

const routes: Routes = [
    {
        path: '',
        component: PresetChargePage,
        // canDeactivate: [CanDeactivatePresetGuard]
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes)
    ],
    declarations: [PresetChargePage]
})
export class PresetChargePageModule {
}
