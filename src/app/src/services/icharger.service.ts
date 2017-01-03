import {Injectable} from "@angular/core";
import {Http} from "@angular/http";
import {Observable, Subject} from "rxjs";
import {Events} from "ionic-angular";

const CHARGER_CONNECTED_EVENT: string = 'charger.connected';
const CHARGER_DISCONNECTED_EVENT: string = 'charger.disconnected';
const CHARGER_CHANNEL_EVENT: string = 'charger.activity';

@Injectable()
export class iChargerService {
  chargerStatus: {} = {};
  channelStatus: any[] = [];

  private pauser: Subject<any>;

  public constructor(public http: Http,
                     public events: Events) {
  }

  isConnectedToServer() {
    return Object.keys(this.chargerStatus).length > 0;
  }

  isConnectedToCharger() {
    if (!this.isConnectedToServer()) {
      return false;
    }

    let statusString = this.chargerStatus['charger_presence'];
    return statusString === 'connected';
  }

  getChargerStatus() {
    let statusRequest = this.http.get("http://192.168.1.176:5000/status");

    // Create a set of URLs to process
    let channelRequests = Observable
      .range(1, 2)
      .filter((v) => { // Only do these if we're connected
        return this.isConnectedToCharger();
      })
      .flatMap((channelNum) => {
        let url = `http://192.168.1.176:5000/channel/${channelNum}`;
        this.events.publish(CHARGER_CHANNEL_EVENT, channelNum);
        return this.http.get(url);
      }).map((response) => {
        let jsonResponse = response.json();
        let channel = Number(jsonResponse["channel"]);
        this.channelStatus[channel] = jsonResponse;
      }).catch((error, caught) => {
        console.log("Channel HTTP Error: ", error);
        return Observable.throw(error);
      }).retry();

    let statusStream = Observable.timer(1000, 1000)
      .flatMap((v) => {
        return this.http.get("http://192.168.1.176:5000/status")
      })
      .map((v) => {
        // console.log('received: ', v.json());
        let notConnectedNow = this.isConnectedToCharger();
        this.chargerStatus = v.json();
        if (!notConnectedNow && this.isConnectedToCharger()) {
          this.events.publish(CHARGER_CONNECTED_EVENT);
        }
        return this.chargerStatus;
      })
      .catch((error, caught) => {
        console.log("HTTP Error: ", error);
        if (this.isConnectedToCharger()) {
          this.events.publish(CHARGER_DISCONNECTED_EVENT);
        }
        this.chargerStatus = {};
        return Observable.throw(error);
      })
      .retry();

    let repeatedchannelRequests = Observable
      .timer(1000, 500)
      .flatMap((v) => {
        return channelRequests;
      });

    return statusStream.merge(statusStream, repeatedchannelRequests);
  }

  getNumberOfChannels() {
    return this.channelStatus.length;
  }

}


export {CHARGER_CONNECTED_EVENT, CHARGER_DISCONNECTED_EVENT, CHARGER_CHANNEL_EVENT}
