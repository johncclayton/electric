import {Component, OnInit} from '@angular/core';
import {select} from '@angular-redux/store';
import {IConfig} from '../../models/state/reducers/configuration';
import {Observable} from 'rxjs';
import {IChargerState} from '../../models/state/reducers/charger';
import {IUIState} from '../../models/state/reducers/ui';
import {Platform} from '@ionic/angular';
import {ConfigurationActions} from '../../models/state/actions/configuration';

@Component({
    selector: 'config-page',
    templateUrl: './config.page.html',
    styleUrls: ['./config.page.scss'],
})
export class ConfigPage implements OnInit {
    @select() config$: Observable<IConfig>;
    @select() charger$: Observable<IChargerState>;
    @select() ui$: Observable<IUIState>;

    constructor(public platform: Platform,
                public actions: ConfigurationActions) {

    }

    ngOnInit() {
    }

    canUseDeploy(): boolean {
        return this.platform.is('cordova');
    }

    testFunc() {

    }
}
