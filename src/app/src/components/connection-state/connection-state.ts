import {Component} from "@angular/core";
import {Events, NavController, Platform, ToastController} from "ionic-angular";
import {iChargerService} from "../../services/icharger.service";
import {NgRedux} from "@angular-redux/store";
import {IAppState} from "../../models/state/configure";

@Component({
    selector: 'connection-state',
    templateUrl: 'connection-state.html'
})
export class ConnectionStateComponent {

    private disconnectionAlert;
    private connectionFailure: number;

    constructor(public platform: Platform,
                public charger: iChargerService,
                public events: Events,
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

        this.ngRedux.subscribe(() => {
            // hmm. how do I listen to just 'some'?
        });

        // this.events.subscribe(CHARGER_CONNECTED_EVENT, () => this.chargerConnected());
        // this.events.subscribe(CHARGER_STATUS_ERROR, () => this.chargerError(null));
        // this.events.subscribe(CHARGER_COMMAND_FAILURE, (error) => this.chargerError(error));
    }

    chargerConnected() {
        if (this.disconnectionAlert) {
            this.disconnectionAlert.dismiss();
            this.disconnectionAlert = null;
        }

        this.connectionFailure = 0;
    }

    chargerError(message) {
        if (message == null) {
            message = 'Connection Problem'
        }
        this.connectionFailure++;
        if (!this.disconnectionAlert) {
            this.disconnectionAlert = this.toastController.create({
                'message': message,
                'cssClass': 'redToast',
                'position': 'bottom',
                'showCloseButton': true,
                'closeButtonText': 'Dismiss'
            });

            this.disconnectionAlert.onDidDismiss(() => {
                // don't do anything.
                // because we don't set the alert to 'nil', the next error won't cause it to show.
                // we could add a timer here, so that it might show in 30s or so, by just setting it to null in 30s.
            });

            this.disconnectionAlert.present();
        } else {
            if (this.connectionFailure > 3) {
                this.disconnectionAlert.setMessage('Reconnecting (' + this.connectionFailure + ')');
            }
        }
    }
}
