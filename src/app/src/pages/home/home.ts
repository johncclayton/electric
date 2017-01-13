import {Component} from "@angular/core";
import {NavController, ToastController, Events} from "ionic-angular";
import {Subscription, Observable} from "rxjs";
import {Http} from "@angular/http";
import {iChargerService, CHARGER_CONNECTED_EVENT, CHARGER_DISCONNECTED_EVENT} from "../../services/icharger.service";

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    public exception: string = "";
    private chargerStatusObserver: Observable<any>;
    private chargerStatusSubscription: Subscription;


    constructor(public navCtrl: NavController,
                public events: Events,
                public toastController: ToastController,
                public chargerService: iChargerService,
                public http: Http) {

        // Put up some nice UI for disconnection
        this.events.subscribe(CHARGER_CONNECTED_EVENT, () => this.chargerConnected());
        this.events.subscribe(CHARGER_DISCONNECTED_EVENT, () => this.chargerDisconnected());

        // TODO: Use this to flash some activity lights
        // this.events.subscribe(CHARGER_CHANNEL_EVENT, (channelNum) => console.log("Activity on channel ", channelNum));
    }

    isConnectedToServer() {
        return this.chargerService.isConnectedToServer();
    }

    isConnectedToCharger() {
        return this.chargerService.isConnectedToCharger();
    }

    ionViewWillEnter() {
        // Use rxjs to poll for charger state continuously
        console.log("Subscribing to charger status events...");
        this.chargerStatusObserver = this.chargerService.getChargerStatus();
        this.chargerStatusSubscription = this.chargerStatusObserver.subscribe(status => {
            if (status['exception']) {
                this.exception = status['exception'];
            } else {
                this.exception = "";
            }

        });
    }

    chargerConnected() {
        // Start getting channel data
        this.showToast('Welcome');

        // Cleanup old ones, if they still exist.
        console.log("Subscribing to charger channel events...");
    }

    channelSubscriptions() {
        if (this.isConnectedToCharger()) {
            let chargerChannelRequests = this.chargerService.getChargerChannelRequests();
            if (chargerChannelRequests) {
                if (chargerChannelRequests.length) {
                    return chargerChannelRequests;
                }
            }
        }
        return [];
    }

    chargerDisconnected() {
        this.showToast('Connection to server was lost');
    }

    cleanupStatusSubscription() {
        if (this.chargerStatusSubscription) {
            console.log("Cleaning up status subscription...");
            this.chargerStatusSubscription.unsubscribe();
            this.chargerStatusSubscription = null;
        }

        if(this.chargerStatusObserver) {
            console.log("Cleanup the channel status observer");
            this.chargerStatusObserver = null;
        }
     }

    showToast(message: string) {
        // about not to be, so show a message
        let toast = this.toastController.create({
            message: message,
            duration: 2000,
            position: 'bottom',
        });
        toast.present();
    }

    ionViewWillLeave() {
        console.log("Leaving dashboard");
        this.cleanupStatusSubscription();
    }

}
