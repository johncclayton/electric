import {Injectable} from "@angular/core";
import {Http} from "@angular/http";
import {Observable} from "rxjs";
import {Configuration} from "./configuration.service";
import {Events} from "ionic-angular";
import {Preset} from "../pages/preset/preset-class";
import {Channel} from "../models/channel";

const CHARGER_CONNECTED_EVENT: string = 'charger.connected';
const CHARGER_DISCONNECTED_EVENT: string = 'charger.disconnected';
const CHARGER_CHANNEL_EVENT: string = 'charger.activity';

export enum ChargerType {
    iCharger410Duo = 64,
    iCharger308Duo = 66
}

export let ChargerMetadata = {};
ChargerMetadata[ChargerType.iCharger308Duo] = {'maxAmps': 30, 'name': 'iCharger 308', 'tag': 'DUO'};
ChargerMetadata[ChargerType.iCharger410Duo] = {'maxAmps': 40, 'name': 'iCharger 410', 'tag': 'DUO'};


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


    getPresets(): Observable<any> {
        let url = this.getChargerURL("/preset");
        return this.http.get(url).map(v => {
            // This should be a list of presets
            let presetList = [];
            let arrayOfPresets = v.json();
            for (let presetDict of arrayOfPresets) {
                presetList.push(new Preset(presetDict));
            }
            return presetList;
        });
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
                console.error("Unable to get charger status, error: ", error);
                if (this.isConnectedToCharger()) {
                    this.events.publish(CHARGER_DISCONNECTED_EVENT);
                }
                this.chargerStatus = {};
                return Observable.throw(error);
            })
            .retry()
            .share();
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
            console.debug(`Creating hot channel observable: ${i}`);
            this.channelStateObservable.push(Observable
                .timer(500, 500)
                .filter(() => {
                    return this.isConnectedToCharger();
                })
                .flatMap((v) => {
                    return this.http.get(this.getChargerURL(`/channel/${i}`));
                })
                .map((response) => {
                    this.events.publish(CHARGER_CHANNEL_EVENT, i);
                    let jsonResponse = response.json();

                    // Maybe reduce the channels, as long as they are 0 volt.
                    let cellLimit = this.config.getCellLimit();
                    let channel = new Channel(i, jsonResponse, cellLimit);
                    this.channelSnapshots[i] = channel;
                    return channel;
                })
                .retry()
                .share()
            );
        }

        // Now need to sort them based on their actual channel number
        // But can't do that until we get the data (which is async)

        console.debug("Subscriptions are: ", this.channelStateObservable);
        this.events.publish(CHARGER_CONNECTED_EVENT);
    }

    lookupChargerMetadata(deviceId = null, propertyName = 'name', defaultValue = null) {
        // Not supplied? Look it up.
        if (deviceId == null) {
            if (this.chargerStatus) {
                deviceId = Number(this.chargerStatus['device_id']);
            }
        }
        if (deviceId) {
            let md = ChargerMetadata[deviceId];
            if (md) {
                if (md[propertyName]) {
                    return md[propertyName];
                }
            }
        }
        return defaultValue;
    }

    getMaxAmpsPerChannel() {
        return this.lookupChargerMetadata(null, 'maxAmps', 15);
    }

    getChargerName() {
        return this.lookupChargerMetadata(null, 'name', 'iCharger');
    }

    getChargerTag() {
        return this.lookupChargerMetadata(null, 'tag', '');
    }

    getMaxCells() {
        return this.lookupChargerMetadata(null, 'cells', 0);
    }

    // Mock data, representing an empty channel
    emptyData(channelNumber: number) {
        let cellLimit = this.getMaxCells();
        let cells = [];
        for (let i = 0; i > cellLimit; i++) {
            cells.push({
                'v': 0,
                'cell': i,
                'balance': 0,
                'ir': 0,
            });
        }
        let channelData = {
            curr_inp_volts: 0,
            curr_out_amps: 0,
            curr_out_capacity: 0,
            timestamp: 0,
            curr_int_temp: 0,
            cells: cells
        };
        return new Channel(channelNumber, channelData, this.config.getCellLimit());
    }
}

export {
    CHARGER_CONNECTED_EVENT,
    CHARGER_DISCONNECTED_EVENT,
    CHARGER_CHANNEL_EVENT,
}
