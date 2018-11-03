import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Routes, RouterModule} from '@angular/router';

import {IonicModule} from '@ionic/angular';

import {PresetStoragePage} from './preset-storage.page';
import {CanDeactivateGuardService} from '../../services/can-deactivate-guard.service';

const routes: Routes = [
    {
        path: '',
        component: PresetStoragePage,
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
    declarations: [PresetStoragePage]
})
export class PresetStoragePageModule {
}
