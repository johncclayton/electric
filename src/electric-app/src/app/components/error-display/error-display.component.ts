import {Component, Input, OnInit} from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {Observable} from 'rxjs';
import {IAppState} from '../../models/state/configure';
import {IUIState} from '../../models/state/reducers/ui';

@Component({
    selector: 'app-error-display',
    templateUrl: './error-display.component.html',
    styleUrls: ['./error-display.component.scss']
})
export class ErrorDisplayComponent implements OnInit {
    @Input() ui: IUIState;

    constructor(public readonly ngRedux: NgRedux<IAppState>) {
    }

    ngOnInit() {
    }

}
