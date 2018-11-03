import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CanDeactivateGuardService} from './services/can-deactivate-guard.service';

const routes: Routes = [
    {path: '', redirectTo: 'home', pathMatch: 'full'},
    {path: 'home', loadChildren: './home/home.module#HomePageModule'},
    {path: 'ChargeOptions', loadChildren: './pages/charge-options/charge-options.module#ChargeOptionsPageModule'},
    {path: 'Config', loadChildren: './pages/config/config.module#ConfigPageModule'},
    {path: 'NetworkConfig', loadChildren: './pages/network-config/network-config.module#NetworkConfigPageModule'},
    {path: 'NetworkWizard', loadChildren: './pages/network-wizard/network-wizard.module#NetworkWizardPageModule'},
    {path: 'SystemSettings', loadChildren: './pages/system-settings/system-settings.module#SystemSettingsPageModule'},
    {path: 'PresetList', loadChildren: './pages/preset-list/preset-list.module#PresetListPageModule'},
    {path: 'Preset', loadChildren: './pages/preset/preset.module#PresetPageModule'},
    {path: 'PresetCharge', loadChildren: './pages/preset-charge/preset-charge.module#PresetChargePageModule'},
    {path: 'PresetDischarge', loadChildren: './pages/preset-discharge/preset-discharge.module#PresetDischargePageModule'},
    {path: 'PresetStorage', loadChildren: './pages/preset-storage/preset-storage.module#PresetStoragePageModule'},
    {path: 'PresetCycle', loadChildren: './pages/preset-cycle/preset-cycle.module#PresetCyclePageModule'},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
    providers: [CanDeactivateGuardService]
})
export class AppRoutingModule {
}
