import {Injectable} from "@angular/core";
import {Http} from "@angular/http";
import {Observable} from "rxjs";
import {Configuration} from "./configuration.service";
import {Events} from "ionic-angular";
import {Preset} from "../pages/preset/preset-class";

const CHARGER_CONNECTED_EVENT: string = 'charger.connected';
const CHARGER_DISCONNECTED_EVENT: string = 'charger.disconnected';
const CHARGER_CHANNEL_EVENT: string = 'charger.activity';

export enum ChargerType {
    iCharger410Duo = 64,
    iCharger308Duo = 66
}

export let ChargerMetadata = [
    {'type': ChargerType.iCharger308Duo, 'maxAmps': 30, 'name': 'iCharger 308', 'tag': 'DUO', 'cells': 8},
    {'type': ChargerType.iCharger410Duo, 'maxAmps': 40, 'name': 'iCharger 410', 'tag': 'DUO', 'cells': 10},
];

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

    getNumberOfActiveCells(channelIndex) {
        return this.channelSnapshots['cellLimit'];
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
                console.log("Unable to get charger status, error: ", error);
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

    private numberOfActiveCells(channel) {
        // Maybe reduce the channels, as long as they are 0 volt.
        let cellLimit = this.config.getCellLimit();
        if (cellLimit > 0) {
            let cells = channel['cells'];

            // Check voltages.
            // If we see a voltage on a channel, we must show everything up to that channel
            // for safety
            let voltageSeenAtIndex = 0;
            cells.forEach((item, index) => {
                if (item.v > 0) {
                    voltageSeenAtIndex = index;
                }
            });
            return Math.max(cellLimit, voltageSeenAtIndex + 1);
        }

        // default to the size of the array
        return channel.cells.lenth;
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
                    let cellLimit = this.numberOfActiveCells(jsonResponse);
                    if (cellLimit != jsonResponse['cells'].length) {
                        jsonResponse['cells'] = jsonResponse['cells'].slice(0, cellLimit);
                    }
                    let channel = Number(jsonResponse["channel"]);
                    this.channelSnapshots[channel] = {
                        index: i,
                        cellLimit: cellLimit,
                        original: channel,
                        json: jsonResponse
                    };
                    return this.channelSnapshots[channel];
                })
                .retry()
                .share()
            );
        }

        // Now need to sort them based on their actual channel number
        // But can't do that until we get the data (which is async)

        console.log("Subscriptions are: ", this.channelStateObservable);
        this.events.publish(CHARGER_CONNECTED_EVENT);
    }

    lookupChargerMetadata(deviceId = null, propertyName = 'name', defaultValue = null) {
        // Not supplied? Look it up.
        if (deviceId == null) {
            if (this.chargerStatus) {
                let md = ChargerMetadata[this.chargerStatus['device_id']];
                if (md) {
                    deviceId = md;
                }
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
}

export {
    CHARGER_CONNECTED_EVENT,
    CHARGER_DISCONNECTED_EVENT,
    CHARGER_CHANNEL_EVENT,
}
