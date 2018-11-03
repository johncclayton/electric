import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Routes, RouterModule} from '@angular/router';

import {IonicModule} from '@ionic/angular';

import {PresetCyclePage} from './preset-cycle.page';
import {CanDeactivateGuardService} from '../../services/can-deactivate-guard.service';

const routes: Routes = [
    {
        path: '',
        component: PresetCyclePage,
        canDeactivate: [CanDeactivateGuardService]
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
