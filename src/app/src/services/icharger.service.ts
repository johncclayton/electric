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
  channelSnapshots: any[] = [];
  numberOfChannels: number = 0;

  private channelStateObservable;

  public constructor(public http: Http,
                     public events: Events,
                     public config: Configuration) {
    this.channelStateObservable = [];
  }

  isConnectedToServer(): boolean {
    return Object.keys(this.chargerStatus).length > 0;
  }

  isConnectedToCharger(): boolean {
    if (!this.isConnectedToServer()) {
      return false;
    }

    if (this.channelSnapshots) {
      let statusString = this.chargerStatus['charger_presence'];
      let channelCount = Number(this.chargerStatus['channel_count']);
      let yay = statusString === 'connected' && channelCount > 0;
      // if(yay) {
      //   console.warn("ooo! ", this.chargerStatus);
      // }
      return yay;
    }
    return false;
  }

  getNumberOfChannels(): number {
    if (!this.isConnectedToServer()) {
      return 0;
    }
    return this.numberOfChannels;
  }

  getChargerStatus(): Observable<any> {
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
    return this.channelStateObservable;
  }

  // Gets the status of the charger
  private getChargerURL(path) {
    let hostName = this.config.getHostName();
    return "http://" + hostName + path;
  }

  private chargerDidAppear(statusDict) {
    this.numberOfChannels = statusDict['channel_count'];
    console.log(`Charger appeared, with ${this.numberOfChannels} channels`);

    // Clear existing observables
    // TODO: do we need to clean these up?
    this.channelStateObservable = [];

    // Creates a series of hot observables for channel data from the charger
    for (let i = 0; i < this.getNumberOfChannels(); i++) {
      console.log(`Creating hot channel observable: ${i}`);
      this.channelStateObservable.push(Observable
        .timer(500, 500)
        .flatMap((v) => {
          return this.http.get(this.getChargerURL(`/channel/${i}`));
        })
        .filter(() => {
          return this.isConnectedToCharger();
        })
        .map((response) => {
          this.events.publish(CHARGER_CHANNEL_EVENT, i);
          let jsonResponse = response.json();
          // console.log(`Channel ${i} data... `, response);
          let channel = Number(jsonResponse["channel"]);
          this.channelSnapshots[channel] = {
            index: i,
            realChannel: channel,
            json: jsonResponse
          };
          return jsonResponse;
        })
        .retry()
      );
    }

    // Now need to sort them based on their actual channel number
    // But can't do that until we get the data (which is async)

    console.log("Subscriptions are: ", this.channelStateObservable);
    this.events.publish(CHARGER_CONNECTED_EVENT);
  }
}

export {
  CHARGER_CONNECTED_EVENT,
  CHARGER_DISCONNECTED_EVENT,
  CHARGER_CHANNEL_EVENT
}
