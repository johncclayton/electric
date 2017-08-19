import {Component} from "@angular/core";
import {NavController, Platform, ToastController} from "ionic-angular";
import {iChargerService} from "../../services/icharger.service";
import {NgRedux} from "@angular-redux/store";
import {IAppState} from "../../models/state/configure";
import {isDefined} from "ionic-angular/util/util";

@Component({
    selector: 'connection-state',
    templateUrl: 'connection-state.html'
})
export class ConnectionStateComponent {
    /*
    Don't ever set this to nil, let the GC do it. Otherwise, you'll have race conditions when the alert is closed by the user.
    The framework looks to be still holding onto it (well, trying to) and if you set it to nil, it seems to do some cleanup, yet STILL be referenced by the f/work later.
    i.e: BOOM. So Just Don't.
     */
    private generalAlert;
    private alertHasBeenPresented: boolean;
    private alertShownBecauseOfConnectionError: boolean = false;
    private lastConnectionFailureCount: number = 0;
    private haveAlertObject = false;

    constructor(public platform: Platform,
                public charger: iChargerService,
                public ngRedux: NgRedux<IAppState>,
                public toastController: ToastController) {

        // Listen for changes to the exception, and do something with the UI
        this.ngRedux.select(['ui', 'exception']).subscribe((message: string) => {
            if (isDefined(message)) {
                if (message) {
                    this.showGeneralError(message, true);
                }
            }
        });

        this.ngRedux.select(['ui', 'disconnectionErrorCount']).subscribe((thing) => {
            let uiState = this.ngRedux.getState().ui;
            if (uiState.disconnected) {
                this.incrementDisconnectionCount();
            } else {
                this.serverReconnected();
            }
        });
    }

    get connectionFailureCount(): number {
        return this.ngRedux.getState().ui.disconnectionErrorCount;
    }

    dismissAlertMessage(wasDismissedByUser = false) {
        if (this.haveAlertObject) {
            // Code is calling this to dismiss the current alert programmatically.
            this.generalAlert.dismiss().then(() => {
                this.haveAlertObject = false;
            });
        }
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
            message = 'Unknown problem?!'
        }

        if (!this.haveAlertObject && allowCreation) {
            this.alertHasBeenPresented = false;
            this.alertShownBecauseOfConnectionError = false;
            this.generalAlert = this.toastController.create({
                'message': message,
                'cssClass': 'redToast',
                'position': 'bottom',
                'showCloseButton': true,
                'closeButtonText': 'Dismiss'
            });

            this.generalAlert.onDidDismiss(() => {
                // Clear the alert... but don't let another show up if the connection errors continue
                this.haveAlertObject = false;
            });

            this.haveAlertObject = true;
        }

        if (this.haveAlertObject) {
            if (this.generalAlert != null) {
                this.generalAlert.setMessage(message);

                if (!this.alertHasBeenPresented) {
                    this.generalAlert.present().then(() => {
                        this.alertHasBeenPresented = true;
                    });
                }
            }
        }
    }

    private incrementDisconnectionCount() {
        this.lastConnectionFailureCount = this.connectionFailureCount;

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
