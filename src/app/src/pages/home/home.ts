import {Component} from "@angular/core";
import {NavController, ToastController, Events} from "ionic-angular";
import {Observable} from "rxjs";
import {Http} from "@angular/http";
import {
  iChargerService, CHARGER_CONNECTED_EVENT, CHARGER_DISCONNECTED_EVENT,
  CHARGER_CHANNEL_EVENT
} from "../../services/icharger.service";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  private chargerStatusSubscription: Observable<any>;

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
    console.log("Streaming charger status");
    this.chargerStatusSubscription = this.chargerService.getChargerStatus();
    this.chargerStatusSubscription.subscribe();
  }

  chargerConnected() {
    // Start getting channel data
    this.showToast('Welcome');
  }

  chargerDisconnected() {
    this.showToast('Connection to server was lost');
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
    this.chargerStatusSubscription = null;
  }

}
