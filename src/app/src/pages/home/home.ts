import {Component} from "@angular/core";
import {NavController} from "ionic-angular";
import {Observable} from "rxjs";
import {Http} from "@angular/http";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  chargerStatus: {} = {};

  private chargerStatusSubscription: Observable<any>;

  constructor(public navCtrl: NavController,
              public http: Http) {

  }

  ionViewWillEnter() {
    // Use rxjs to poll for charger state continuously
    console.log("Streaming charger status");
    this.getChargerStatus().subscribe();
  }

  ionViewWillLeave() {
    console.log("Leaving the page");
    this.chargerStatusSubscription = null;
  }

  isConnectedToServer() {
    return Object.keys(this.chargerStatus).length > 0;
  }

  isConnectedToCharger() {
    if (!this.isConnectedToServer()) {
      return false;
    }
    return this.chargerStatus['charger_presence'] === 'connected';
  }

  getChargerStatus() {
    return Observable.timer(1000, 1000)
      .flatMap((v) => {
        return this.http.get("http://localhost:5000/status")
      })
      .map((v) => {
        return this.chargerStatus = v.json();
      })
      .catch((error, caught) => {
        console.log("HTTP Error: ", error);
        this.chargerStatus = {};
        return Observable.throw(error);
      })
      .retry()
  }
}
