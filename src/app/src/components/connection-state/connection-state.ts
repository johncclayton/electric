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
    private generalAlert;
    private disconnectionEventWasAlertInitiator: boolean = false;
    private connectionFailure: number;

    constructor(public platform: Platform,
                public charger: iChargerService,
                public ngRedux: NgRedux<IAppState>,
                public navContoller: NavController,
                public toastController: ToastController) {

        this.platform.ready().then(() => {
            // Network.onchange().subscribe(() => {
            //     console.log("Network changed to: ", Network.type);
            //     this.haveNetwork = Network.type != 'none';
            // });
        });

        this.connectionFailure = 0;

        // Listen for changes to the exception, and do something with the UI
        this.ngRedux.select(['ui', 'exception']).subscribe((message: string) => {
            if (isDefined(message)) {
                if (message) {
                    this.showGeneralError(message);
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

    clearAlertMessage() {
        if (this.generalAlert) {
            // DONT DO THIS. You get exceptions if you DO!
            // this.generalAlert.dismiss();
            this.generalAlert = null;
        }
        this.connectionFailure = 0;
        this.disconnectionEventWasAlertInitiator = false;
    }

    serverReconnected() {
        /*
        If we showed an altert only because of connection problem... then take it away.
        Otherwise, let the user do it.
         */
        if (this.disconnectionEventWasAlertInitiator) {
            if (this.generalAlert != null) {
                // For some reason we need to do this. Setting it to null isn't enough.
                // YET: don't do that ALWAYS... otherwise you get exceptions.
                this.generalAlert.dismiss();
            }
            this.clearAlertMessage();
        }
    }

    showGeneralError(message: string) {
        if (message == null) {
            message = 'Unknown problem?!'
        }

        if (this.generalAlert == null) {
            this.generalAlert = this.toastController.create({
                'message': message,
                'cssClass': 'redToast',
                'position': 'bottom',
                'showCloseButton': true,
                'closeButtonText': 'Dismiss'
            });

            this.generalAlert.onDidDismiss(() => {
                // Clear the alert.
                this.clearAlertMessage();
            });
        }

        this.generalAlert.setMessage(message);
        this.generalAlert.present();
    }

    private incrementDisconnectionCount() {
        this.connectionFailure++;
        if (this.connectionFailure > 2) {
            let message = 'Reconnecting (' + this.connectionFailure + ')';
            this.disconnectionEventWasAlertInitiator = true;
            this.showGeneralError(message);
        }
    }
}
