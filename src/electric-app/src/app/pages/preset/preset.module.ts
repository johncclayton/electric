import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Routes, RouterModule} from '@angular/router';

import {IonicModule} from '@ionic/angular';

import {PresetPage} from './preset.page';
import {CanDeactivatePresetGuard} from '../../services/can-deactivate-preset-guard.service';

const routes: Routes = [
    {
        path: '',
        component: PresetPage,
        canDeactivate: [CanDeactivatePresetGuard]
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes)
    ],
    declarations: [PresetPage]
})
export class PresetPageModule {
}
