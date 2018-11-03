import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';

import {IonicModule} from '@ionic/angular';

import {PresetDischargePage} from './preset-discharge.page';
import {ComponentsModule} from '../../components/components.module';
import {CanDeactivatePresetGuard} from '../../services/can-deactivate-preset-guard.service';

const routes: Routes = [
    {
        path: '',
        component: PresetDischargePage,
        // canDeactivate: [CanDeactivatePresetGuard]
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ComponentsModule,
        RouterModule.forChild(routes)
    ],
    declarations: [PresetDischargePage]
})
export class PresetDischargePageModule {
}
