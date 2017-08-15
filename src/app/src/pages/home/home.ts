import {Component} from "@angular/core";
import {NavController, ToastController} from "ionic-angular";
import {Observable} from "rxjs";
import {Http} from "@angular/http";
import {iChargerService} from "../../services/icharger.service";
import {NgRedux, select} from "@angular-redux/store";
import {IAppState} from "../../models/state/configure";
import {Channel} from "../../models/channel";

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    @select('ui.exception') exception$: Observable<any>;
    @select('charger') charger$: Observable<Channel>;
    @select('config') config$: Observable<Channel>;

    constructor(public readonly navCtrl: NavController,
                public readonly toastController: ToastController,
                public readonly chargerService: iChargerService,
                public readonly ngRedux: NgRedux<IAppState>,
                public readonly http: Http) {
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
        // this.navCtrl.push(ConfigPage);
    }

    channelSubscriptions() {
        if (this.isConnectedToCharger()) {
            // let chargerChannelRequests = this.chargerService.getChargerChannelRequests();
            // if (chargerChannelRequests) {
            //     if (chargerChannelRequests.length) {
            //         return chargerChannelRequests;
            //     }
            // }
        }
        return [];
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
    }

}
