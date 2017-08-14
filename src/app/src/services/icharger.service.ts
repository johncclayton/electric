import {Injectable} from "@angular/core";
import {Headers, Http, RequestOptions} from "@angular/http";
import {Observable} from "rxjs";
import {Configuration} from "./configuration.service";
import {Events} from "ionic-angular";
import {Preset} from "../models/preset-class";
import {Channel} from "../models/channel";
import {System} from "../models/system";
import {NgRedux} from "@angular-redux/store";
import {IAppState} from "../models/state/configure";
import {ChargerActions} from "../models/state/actions/charger";
import {UIActions} from "../models/state/actions/ui";

export enum ChargerType {
    iCharger4010Duo = 64,
    iCharger406Duo = 67, // ??? probably not. We need to get the model number.
    iCharger308Duo = 66
}

export let ChargerMetadata = {};
ChargerMetadata[ChargerType.iCharger308Duo] = {'maxAmps': 30, 'name': 'iCharger 308', 'tag': 'DUO', 'cells': 8};
ChargerMetadata[ChargerType.iCharger406Duo] = {'maxAmps': 40, 'name': 'iCharger 406', 'tag': 'DUO', 'cells': 6};
ChargerMetadata[ChargerType.iCharger4010Duo] = {'maxAmps': 40, 'name': 'iCharger 4010', 'tag': 'DUO', 'cells': 10};

@Injectable()
export class iChargerService {
    autoStopSubscriptions: any[] = [];

    private chargerStatusSubscription;

    public constructor(public http: Http,
                       public events: Events,
                       public chargerActions: ChargerActions,
                       public uiActions: UIActions,
                       public ngRedux: NgRedux<IAppState>,
                       public config: Configuration) {


        this.chargerStatusSubscription = this.getChargerStatus().subscribe(status => {
            // console.log("Refreshed from charger...");
        });
    }

    isConnectedToServer(): boolean {
        return this.getState().charger.connected;
    }

    isConnectedToCharger(): boolean {
        if (!this.isConnectedToServer()) {
            return false;
        }

        return this.getState().charger.channel_count > 0;
    }

    anyNetworkOrConnectivityProblems() {
        let haveNetwork = this.isNetworkAvailable();
        let haveCharger = this.isConnectedToCharger();
        let haveServer = this.isConnectedToServer();
        return !haveNetwork || !haveCharger || !haveServer;
    }

    isNetworkAvailable(): boolean {
        // TODO: Make this smarter
        return true;
    }

    getState(): IAppState {
        return this.ngRedux.getState();
    }

    getNumberOfChannels(): number {
        return this.getState().charger.channel_count;
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
            .flatMap(v => {
                return this.http.get(this.getChargerURL("/unified"));
            }).map(r => {
                this.chargerActions.refreshStateFromCharger(r.json());
            })
            .catch(error => {
                this.uiActions.setErrorMessage(error);

                // I think I do this to force a 'retry'?
                return Observable.throw(error);
            })
            .retry()
            .share();
    }

    // Gets the status of the charger
    private getChargerURL(path) {
        let hostName = this.config.getHostName();
        return "http://" + hostName + path;
    }

    lookupChargerMetadata(deviceId = null, propertyName = 'name', defaultValue = null) {
        // Not supplied? Look it up.
        if (deviceId == null) {
            deviceId = this.getState().charger.device_id;
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
                this.uiActions.setErrorMessage("Can't save: " + error);
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

    getSystem(): Observable<System> {
        return Observable.create((observable) => {
            let operationURL = this.getChargerURL("/system");
            this.http.get(operationURL).subscribe((resp) => {
                if (!resp.ok) {
                    observable.error(resp);
                } else {
                    let sysObj = new System(resp.json());
                    observable.next(sysObj);
                    observable.complete();
                }
            });
        });
    }

    toggleChargerTempUnits(): Observable<System> {
        let operationURL = this.getChargerURL("/system");
        return Observable.create((observable) => {
            this.getSystem().subscribe((sysObj) => {
                sysObj.isCelsius = !sysObj.isCelsius;

                let headers = new Headers({'Content-Type': 'application/json'});
                let options = new RequestOptions({headers: headers});
                this.http.put(operationURL, sysObj.json(), options).subscribe((resp) => {
                    if (!resp.ok) {
                        observable.error(resp);
                    } else {
                        observable.next(sysObj);
                        observable.complete();
                    }
                }, error => {
                    observable.error();
                });

            }, (error) => {
                observable.error(error);
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
        return;
        // this.cancelAutoStopForChannel(channel);
        //
        // this.autoStopSubscriptions[channel.index] = this.channelStateObservable[channel.index].takeWhile((channel) => {
        //     console.log("Channel ", channel.index, ", state: ", channel.runState);
        //     return !states_to_stop_on.some((state) => {
        //         return channel.runState == state;
        //     });
        // }).subscribe((value) => {
        // }, (error) => {
        //     console.log("Error while waiting for the channel to change state");
        //     this.cancelAutoStopForChannel(channel);
        // }, () => {
        //
        //     console.log("Sending stop to channel ", channel.index, " because auto-stop condition was met");
        //     this.stopCurrentTask(channel).subscribe();
        //     this.cancelAutoStopForChannel(channel);
        // });
    }

}

