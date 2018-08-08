import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
    {path: '', redirectTo: 'home', pathMatch: 'full'},
    {path: 'home', loadChildren: './home/home.module#HomePageModule'},
    {path: 'ChargeOptions', loadChildren: './pages/charge-options/charge-options.module#ChargeOptionsPageModule'},
    {path: 'Config', loadChildren: './pages/config/config.module#ConfigPageModule'},
    {path: 'NetworkConfig', loadChildren: './pages/network-config/network-config.module#NetworkConfigPageModule'},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
