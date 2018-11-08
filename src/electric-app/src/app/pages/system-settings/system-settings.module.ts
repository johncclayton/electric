import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';

import {IonicModule} from '@ionic/angular';

import {SystemSettingsPage} from './system-settings.page';
import {ComponentsModule} from '../../components/components.module';
import {GenericDeactivateGuard} from '../../services/can-deactivate-preset-guard.service';

const routes: Routes = [
    {
        path: '',
        component: SystemSettingsPage,
        canDeactivate: [GenericDeactivateGuard]
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
    declarations: [SystemSettingsPage]
})
export class SystemSettingsPageModule {
}
