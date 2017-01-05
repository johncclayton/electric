import {Injectable} from "@angular/core";
import {Http} from "@angular/http";
import {Observable} from "rxjs";
import {Configuration} from "./configuration.service";
import {Events} from "ionic-angular";
import {iChargerService} from "./icharger.service";

const CHARGER_CONNECTED_EVENT: string = 'charger.connected';
const CHARGER_DISCONNECTED_EVENT: string = 'charger.disconnected';
const CHARGER_CHANNEL_EVENT: string = 'charger.activity';

@Injectable()
export class iChargerMockService extends iChargerService {
  chargerStatus: {} = {
    "ch1_status": {
      "balance": 0,
      "cell_volt_status": 0,
      "ctrl_status": 0,
      "dlg_box_status": 0,
      "err": 0,
      "run": 0,
      "run_status": 0
    },
    "ch2_status": {
      "balance": 0,
      "cell_volt_status": 0,
      "ctrl_status": 0,
      "dlg_box_status": 0,
      "err": 0,
      "run": 0,
      "run_status": 0
    },
    "channel_count": 2,
    "charger_presence": "connected",
    "device_id": 66,
    "device_sn": "1308308201\u0000\u0000",
    "hardware_ver": 2000,
    "memory_len": 167,
    "software_ver": 2107,
    "system_len": 118
  };

  channelSnapshots: any[] = [];

  public constructor(public http: Http,
                     public events: Events,
                     public config: Configuration) {
    super(http, events, config);
  }

  isConnectedToServer(): boolean {
    return true;
  }

  isConnectedToCharger(): boolean {
    return true;
  }

  getNumberOfChannels(): number {
    return 2;
  }

  getChargerStatus(): Observable<any> {
    this.events.publish(CHARGER_CONNECTED_EVENT);
    return Observable.of(this.chargerStatus).retry();
  }

  getChargerChannelRequests() {
    let dataObservable = Observable.of({
      foo: "bar",
      scud: 3
    });
    return Observable
      .timer(1000, 1000)
      .flatMap((v) => dataObservable)
      .retry();
  }
}

export {
  CHARGER_CONNECTED_EVENT,
  CHARGER_DISCONNECTED_EVENT,
  CHARGER_CHANNEL_EVENT
}
