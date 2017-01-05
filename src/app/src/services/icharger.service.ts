import {Injectable} from "@angular/core";
import {Http} from "@angular/http";
import {Observable} from "rxjs";
import {Configuration} from "./configuration.service";
import {Events} from "ionic-angular";

const CHARGER_CONNECTED_EVENT: string = 'charger.connected';
const CHARGER_DISCONNECTED_EVENT: string = 'charger.disconnected';
const CHARGER_CHANNEL_EVENT: string = 'charger.activity';

@Injectable()
export class iChargerService {
  chargerStatus: {} = {};
  channelStatus: any[] = [];
  numberOfChannels: number = 0;

  private channelStateObservable: Observable<any>;

  public constructor(public http: Http,
                     public events: Events,
                     public config: Configuration) {
    this.channelStateObservable = null;
  }

  isConnectedToServer(): boolean {
    return Object.keys(this.chargerStatus).length > 0;
  }

  isConnectedToCharger(): boolean {
    if (!this.isConnectedToServer()) {
      return false;
    }

    if (this.channelStatus) {
      let statusString = this.chargerStatus['charger_presence'];
      let channelCount = Number(this.chargerStatus['channel_count']);
      return statusString === 'connected' && channelCount > 0;
    }
    return false;
  }

  getNumberOfChannels(): number {
    if (!this.isConnectedToServer()) {
      return 0;
    }
    return this.numberOfChannels;
  }

  chargerDidAppear(statusDict) {
    this.numberOfChannels = statusDict['channel_count'];
    console.log(`Charger appeared, with ${this.numberOfChannels} channels`);

    if (this.getNumberOfChannels() > 0) {
      this.channelStateObservable = Observable
        .range(1, this.getNumberOfChannels())
        .filter((v) => { // Only do these if we're connected
          return this.isConnectedToCharger();
        })
        .flatMap((channelNum) => {
          let url = this.getChargerURL(`/channel/${channelNum}`);
          this.events.publish(CHARGER_CHANNEL_EVENT, channelNum);
          return this.http.get(url);
        }).map((response) => {
          let jsonResponse = response.json();
          let channel = Number(jsonResponse["channel"]);
          this.channelStatus[channel] = jsonResponse;
        }).retry();
      console.log("Created channel observable: ", this.channelStateObservable);
    } else {
      this.channelStateObservable = null;
    }

    this.events.publish(CHARGER_CONNECTED_EVENT);
  }

  // Gets the status of the charger
  getChargerURL(path) {
    let hostName = this.config.getHostName();
    return "http://" + hostName + path;
  }

  getChargerStatus() {
    return Observable.timer(1000, 1000)
      .flatMap((v) => {
        return this.http.get(this.getChargerURL("/status"));
      })
      .map((v) => {
        let notConnectedNow = this.isConnectedToCharger();
        this.chargerStatus = v.json();
        if (!notConnectedNow && this.isConnectedToCharger()) {
          this.chargerDidAppear(this.chargerStatus);
        }
        return this.chargerStatus;
      })
      .catch(error => {
        console.log("Unable to get charger status, error: ", error);
        if (this.isConnectedToCharger()) {
          this.events.publish(CHARGER_DISCONNECTED_EVENT);
        }
        this.chargerStatus = {};
        return Observable.throw(error);
      })
      .retry();
  }

  getChargerChannelRequests() {
    if (this.channelStateObservable) {
      return Observable
        .timer(1000, 500)
        .flatMap((v) => {
          return this.channelStateObservable;
        });
    }
    console.log("Service warning: request channel state observable, but there isn't any!");
    return null;
  }

}

export {
  CHARGER_CONNECTED_EVENT,
  CHARGER_DISCONNECTED_EVENT,
  CHARGER_CHANNEL_EVENT
}
