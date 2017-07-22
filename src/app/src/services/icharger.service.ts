import {Injectable} from "@angular/core";
import {Http, Headers, RequestOptions} from "@angular/http";
import {Observable} from "rxjs";
import {Configuration} from "./configuration.service";
import {Events} from "ionic-angular";
import {Preset} from "../pages/preset/preset-class";
import {Channel} from "../models/channel";

const CHARGER_CONNECTED_EVENT: string = 'charger.connected'; // connected!
const CHARGER_DISCONNECTED_EVENT: string = 'charger.disconnected'; // connection error
const CHARGER_STATUS_ERROR: string = 'charger.status.error'; // when we can't get the charger status
const CHARGER_COMMAND_FAILURE: string = 'charger.command.error'; // when a save command goes bad
const CHARGER_CHANNEL_EVENT: string = 'charger.activity';

export enum ChargerType {
    iCharger4010Duo = 64,
    iCharger406Duo = 67, // ??? probably not. We need to get the model number.
    iCharger308Duo = 66
}

export let ChargerMetadata = {};
ChargerMetadata[ChargerType.iCharger308Duo] = {'maxAmps': 30, 'name': 'iCharger 308', 'tag': 'DUO', 'cells' : 8};
ChargerMetadata[ChargerType.iCharger406Duo] = {'maxAmps': 40, 'name': 'iCharger 406', 'tag': 'DUO', 'cells' : 6};
ChargerMetadata[ChargerType.iCharger4010Duo] = {'maxAmps': 40, 'name': 'iCharger 4010', 'tag': 'DUO', 'cells' : 10};

@Injectable()
export class iChargerService {
    chargerStatus: {} = {};
    channelSnapshots: any[] = [];
    autoStopSubscriptions: any[] = [];
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

    anyNetworkOrConnectivityProblems() {
        let haveNetwork = this.isNetworkAvailable();
        let haveCharger = this.isConnectedToCharger();
        let haveServer = this.isConnectedToServer();
        return !haveNetwork || !haveCharger || !haveServer;
    }

    isNetworkAvailable(): boolean {
        return true;
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
                let connected = this.isConnectedToCharger();
                this.chargerStatus = v.json();

                let chargerHasAppeared = !connected && this.isConnectedToCharger();
                if (chargerHasAppeared) {
                    this.chargerDidAppear(this.chargerStatus);
                }
                return this.chargerStatus;
            })
            .catch(error => {
                this.chargerStatusError();
                this.chargerDidDisappear(error);
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

    private chargerStatusError() {
        console.error("Unable to get charger status");
        this.events.publish(CHARGER_STATUS_ERROR);
    }

    private chargerDidDisappear(error) {
        if (this.isConnectedToCharger()) {
            console.error("Disconnected from the charger, ", error);
            this.events.publish(CHARGER_DISCONNECTED_EVENT);
        }
        this.chargerStatus = {};
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
                .timer(500, 1000)
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

                    // Create a new channel if required. Or reuse an existing.
                    if(i in this.channelSnapshots) {
                        // existing channel
                        let channel:Channel = this.channelSnapshots[i];
                        channel.updateStateFrom(jsonResponse, cellLimit);
                    } else {
                        this.channelSnapshots[i] = new Channel(i, jsonResponse, cellLimit);
                    }

                    return this.channelSnapshots[i];
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

    stopCurrentTask(channel: Channel): Observable<any> {
        this.cancelAutoStopForChannel(channel);
        return Observable.create((observable) => {
            console.log("Stopping current task...");
            let url = this.getChargerURL("/stop/" + channel.index);

            this.http.put(url, "").subscribe((resp) => {
                if (resp.ok) {
                    // Maaay need to do this again, to get past the 'STOPS' state.
                    observable.complete();
                } else {
                    observable.error(resp);
                }
            });
        });
    }

    savePreset(preset: Preset): Observable<any> {
        // An existing preset? in a memory slot?
        return Observable.create((observable) => {
            let addingNewPreset = preset.index < 0;
            let putURL = addingNewPreset ? this.getChargerURL("/addpreset") : this.getChargerURL("/preset/" + preset.index);
            let body = preset.json();
            console.log("Saving Preset: ", body);

            let headers = new Headers({'Content-Type': 'application/json'});
            let options = new RequestOptions({headers: headers});

            this.http.put(putURL, body, options).subscribe((resp) => {
                // Expect a copy of the modified preset?
                // If we were adding, the preset is returned. If we're saving, it isn't.
                // At the moment, it just returns "ok"
                if (resp.ok) {
                    // Yay
                    if (addingNewPreset) {
                        // Return the newly saved preset, with its new memory slot (index)
                        let new_preset = new Preset(resp.json());
                        observable.next(new_preset);
                    } else {
                        // Just return the modified preset, that the user just saved
                        observable.next(preset);
                    }
                    observable.complete();
                } else {
                    observable.error(resp);
                }
            }, (error) => {
                console.log("Error saving preset: ", error);
                this.events.publish(CHARGER_COMMAND_FAILURE, error);
                observable.error(error);
            });

        });
    }

    startCharge(channel: Channel, preset: Preset): Observable<any> {
        this.autoStopOnRunStatus([40], channel);
        return Observable.create((observable) => {
            let operationURL = this.getChargerURL("/charge/" + channel.index + "/" + preset.index);
            console.log("Beginning charge on channel ", channel.index, " using preset at slot ", preset.index);
            this.http.put(operationURL, null).subscribe((resp) => {
                if (resp.ok) {
                    observable.complete();
                } else {
                    observable.error(resp);
                }
            });
        });
    }

    startDischarge(channel: Channel, preset: Preset): Observable<any> {
        this.autoStopOnRunStatus([40], channel);
        return Observable.create((observable) => {
            let operationURL = this.getChargerURL("/discharge/" + channel.index + "/" + preset.index);
            console.log("Beginning discharge on channel ", channel.index, " using preset at slot ", preset.index);
            this.http.put(operationURL, null).subscribe((resp) => {
                if (resp.ok) {
                    observable.complete();
                } else {
                    observable.error(resp);
                }
            });
        });
    }

    startStore(channel: Channel, preset: Preset) {
        this.autoStopOnRunStatus([40], channel);
        return Observable.create((observable) => {
            let operationURL = this.getChargerURL("/store/" + channel.index + "/" + preset.index);
            console.log("Beginning storage on channel ", channel.index, " using preset at slot ", preset.index);
            this.http.put(operationURL, "").subscribe((resp) => {
                if (resp.ok) {
                    observable.complete();
                } else {
                    observable.error(resp);
                }
            });
        });
    }

    startBalance(channel: Channel, preset: Preset) {
        this.autoStopOnRunStatus([40], channel);
        return Observable.create((observable) => {
            let operationURL = this.getChargerURL("/balance/" + channel.index + "/" + preset.index);
            console.log("Beginning balance on channel ", channel.index, " using preset at slot ", preset.index);
            this.http.put(operationURL, "").subscribe((resp) => {
                if (resp.ok) {
                    observable.complete();
                } else {
                    observable.error(resp);
                }
            });
        });
    }

    measureIR(channel: Channel) {
        return Observable.create((observable) => {
            let operationURL = this.getChargerURL("/measureir/" + channel.index);
            console.log("Beginning IR measurement on channel ", channel.index);
            this.http.put(operationURL, "").subscribe((resp) => {
                if (resp.ok) {
                    observable.complete();
                } else {
                    observable.error(resp);
                }
            });
        });
    }

    cancelAutoStopForChannel(channel: Channel) {
        if (this.autoStopSubscriptions[channel.index]) {
            console.log("Cancelled auto-stop subscription for channel ", channel.index);
            this.autoStopSubscriptions[channel.index].unsubscribe();
            this.autoStopSubscriptions[channel.index] = null;
        }
    }

    autoStopOnRunStatus(states_to_stop_on: [number], channel: Channel) {
        this.cancelAutoStopForChannel(channel);

        this.autoStopSubscriptions[channel.index] = this.channelStateObservable[channel.index].takeWhile((channel) => {
            console.log("Channel ", channel.index, ", state: ", channel.runState);
            return !states_to_stop_on.some((state) => {
                return channel.runState == state;
            });
        }).subscribe((value) => {
        }, (error) => {
            console.log("Error while waiting for the channel to change state");
            this.cancelAutoStopForChannel(channel);
        }, () => {

            console.log("Sending stop to channel ", channel.index, " because auto-stop condition was met");
            this.stopCurrentTask(channel).subscribe();
            this.cancelAutoStopForChannel(channel);
        });
    }
}

export {
    CHARGER_CONNECTED_EVENT,
    CHARGER_DISCONNECTED_EVENT,
    CHARGER_STATUS_ERROR,
    CHARGER_COMMAND_FAILURE,
    CHARGER_CHANNEL_EVENT,
}
