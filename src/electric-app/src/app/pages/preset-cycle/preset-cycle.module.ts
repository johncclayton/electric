import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Routes, RouterModule} from '@angular/router';

import {IonicModule} from '@ionic/angular';

import {PresetCyclePage} from './preset-cycle.page';
import {CanDeactivatePresetGuard} from '../../services/can-deactivate-preset-guard.service';

const routes: Routes = [
    {
        path: '',
        component: PresetCyclePage,
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
    declarations: [PresetCyclePage]
})
export class PresetCyclePageModule {
}
