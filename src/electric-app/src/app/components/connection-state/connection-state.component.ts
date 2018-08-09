import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgRedux} from '@angular-redux/store';
import {IAppState} from '../../models/state/configure';
import {Subject} from 'rxjs';
import {Platform} from '@ionic/angular';
import {isDefined} from '@angular/compiler/src/util';
import {takeUntil} from 'rxjs/operators';

@Component({
    selector: 'connection-state',
    templateUrl: './connection-state.component.html',
    styleUrls: ['./connection-state.component.scss']
})
export class ConnectionStateComponent implements OnInit, OnDestroy {
    message: string;
    isShowing: boolean = false;
    showCloseButton: boolean = false;

    private alertShownBecauseOfConnectionError: boolean = false;
    private lastConnectionFailureCount: number = 0;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public platform: Platform,
                public ngRedux: NgRedux<IAppState>) {

        // Listen for changes to the exception, and do something with the UI
        this.ngRedux.select(['ui', 'exception'])
            .pipe(
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((message: string) => {
                if (isDefined(message)) {
                    if (message) {
                        this.showGeneralError(message, true);
                    }
                }
            });

        this.ngRedux.select(['ui', 'disconnectionErrorCount'])
            .pipe(
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((thing) => {
                let uiState = this.ngRedux.getState().ui;
                if (uiState.disconnected) {
                    this.incrementDisconnectionCount();
                } else {
                    this.serverReconnected();
                }
            });
    }

    ngOnInit() {
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    get connectionFailureCount(): number {
        return this.ngRedux.getState().ui.disconnectionErrorCount;
    }

    dismissAlertMessage(wasDismissedByUser = false) {
        if (this.isShowing) {
            // Code is calling this to dismiss the current alert programmatically.
            this.isShowing = false;
        }
    }

    closeBox() {
        this.dismissAlertMessage(true);
    }

    // Server is back. Clear down the current alert if we were responsible for it.
    serverReconnected() {
        if (this.alertShownBecauseOfConnectionError) {
            this.dismissAlertMessage();
            this.alertShownBecauseOfConnectionError = false;
        }
    }

    showGeneralError(message: string, allowCreation = false) {
        if (message == null) {
            message = 'Unknown problem?!';
        }

        this.createNewAlert(message, allowCreation);
    }

    createNewAlert(message: string, allowCreation: boolean) {
        this.showCloseButton = false;
        this.message = message;

        if (!this.isShowing && allowCreation) {
            this.showCloseButton = true;
            this.isShowing = true;
        }
    }

    private incrementDisconnectionCount() {
        this.lastConnectionFailureCount = this.connectionFailureCount;

        if (this.ngRedux.getState().ui.isConfiguringNetwork) {
            return;
        }

        // If we get to three, begin showing the dialog.
        let message = 'Reconnecting (' + this.connectionFailureCount + ')';
        let numberOfWarningsToSkip = 2;
        if (this.connectionFailureCount == numberOfWarningsToSkip) {
            // Show a new warning. Low failure counts mean "new connection failure".
            this.showGeneralError(message, true);
            this.alertShownBecauseOfConnectionError = true;
        } else {
            // This will update the message, but it won't show a NEW message if that has already been dismissed
            this.showGeneralError(message);
        }
    }
}
