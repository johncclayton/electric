import {Component} from "@angular/core";
import {NavController, ToastController} from "ionic-angular";
import {Subscription, Observable} from "rxjs";
import {Http} from "@angular/http";
import {iChargerService} from "../../services/icharger.service";
import {Configuration} from "../../services/configuration.service";

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    public exception: string = "";
    private chargerStatusObserver: Observable<any>;
    private chargerStatusSubscription: Subscription;


    constructor(public readonly navCtrl: NavController,
                public readonly toastController: ToastController,
                public readonly chargerService: iChargerService,
                public readonly config: Configuration,
                public readonly http: Http) {

        // TODO: Use this to flash some activity lights
        // this.events.subscribe(CHARGER_CHANNEL_EVENT, (channelNum) => console.log("Activity on channel ", channelNum));
    }

    anyNetworkOrConnectivityProblems() {
        return this.chargerService.anyNetworkOrConnectivityProblems();
    }

    isNetworkAvailable(): boolean {
        return this.chargerService.isNetworkAvailable();
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

    cleanupStatusSubscription() {
        if (this.chargerStatusSubscription) {
            console.log("Cleaning up status subscription...");
            this.chargerStatusSubscription.unsubscribe();
            this.chargerStatusSubscription = null;
        }

        if (this.chargerStatusObserver) {
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
