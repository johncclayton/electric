import {Injectable} from "@angular/core";
import {Headers, Http, RequestOptions} from "@angular/http";
import {Observable} from "rxjs";
import {Preset} from "../models/preset-class";
import {Channel} from "../models/channel";
import {System} from "../models/system";
import {NgRedux} from "@angular-redux/store";
import {IAppState} from "../models/state/configure";
import {ChargerActions} from "../models/state/actions/charger";
import {UIActions} from "../models/state/actions/ui";
import {IConfig} from "../models/state/reducers/configuration";
import {IChargerState} from "../models/state/reducers/charger";
import {Vibration} from "@ionic-native/vibration";
import {Subject} from "rxjs/Subject";

export enum ChargerType {
    iCharger4010Duo = 64,
    iCharger308Duo = 66,
    iCharger406Duo = 67 // ??? probably not. We need to get the model number.
}

export let ChargerMetadata = {};
ChargerMetadata[ChargerType.iCharger308Duo] = {
    'maxAmps': 30,
    'name': 'iCharger 308',
    'tag': 'DUO',
    'cells': 8,
    'maxVolts': 30
};
ChargerMetadata[ChargerType.iCharger406Duo] = {
    'maxAmps': 40,
    'name': 'iCharger 406',
    'tag': 'DUO',
    'cells': 6,
    'maxVolts': 26
};
ChargerMetadata[ChargerType.iCharger4010Duo] = {
    'maxAmps': 40,
    'name': 'iCharger 4010',
    'tag': 'DUO',
    'cells': 10,
    'maxVolts': 38
};

@Injectable()
export class iChargerService {
    autoStopSubscriptions: any[] = [];

    private static device_id: number;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();

        this.cancelAutoStopForChannel(0);
        this.cancelAutoStopForChannel(1);
    }

    public constructor(public http: Http,
                       public chargerActions: ChargerActions,
                       public vibration: Vibration,
                       public uiActions: UIActions,
                       private ngRedux: NgRedux<IAppState>) {


        this.getChargerStatus()
            .takeUntil(this.ngUnsubscribe)
            .subscribe(status => {
                // console.log("Refreshed from charger...");
            });

        // NOTE:
        // do not access ngRedux here. It'll be nil.
    }

    getConfig(): IConfig {
        return this.ngRedux.getState().config;
    }

    getCharger(): IChargerState {
        return this.ngRedux.getState().charger;
    }

    isConnectedToServer(): boolean {
        return this.ngRedux.getState().ui.disconnected === false;
    }

    isConnectedToCharger(): boolean {
        if (!this.isConnectedToServer()) {
            return false;
        }

        return this.getCharger().channel_count > 0;
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

    getNumberOfChannels(): number {
        return this.getCharger().channel_count;
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
        let interval = 1000;

        return Observable.timer(interval, interval)
            .flatMap(v => {
                let url = this.getChargerURL("/unified");
                return this.http.get(url);
            }).map(r => {
                let state = this.ngRedux.getState();

                // Update device ID
                iChargerService.device_id = state.charger.device_id;
                this.chargerActions.refreshStateFromCharger(r.json());

                if (state.ui.disconnected) {
                    this.uiActions.serverReconnected();
                }
            })
            .catch(error => {
                console.error("Probably connection problem: " + error);
                this.uiActions.setDisconnected();

                // I think I do this to force a 'retry'?
                return Observable.throw(error);
            })
            .retry();
    }

    getHostName(): string {
        let config = this.getConfig();
        return config.ipAddress + ":" + config.port;
    }

    // Gets the status of the charger
    private getChargerURL(path) {
        return "http://" + this.getHostName() + path;
    }

    static lookupChargerMetadata(deviceId = null, propertyName = 'name', defaultValue = null) {
        // Not supplied? Look it up.
        if (!deviceId) {
            return defaultValue;
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
        return iChargerService.lookupChargerMetadata(iChargerService.device_id, 'maxAmps', 15);
    }

    getChargerName() {
        return iChargerService.lookupChargerMetadata(iChargerService.device_id, 'name', 'iCharger');
    }

    getChargerTag() {
        return iChargerService.lookupChargerMetadata(iChargerService.device_id, 'tag', '');
    }

    getMaxCells() {
        return iChargerService.lookupChargerMetadata(iChargerService.device_id, 'cells', 0);
    }

    stopCurrentTask(channel: Channel): Observable<any> {
        this.cancelAutoStopForChannel(channel.index);
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

    /* Same as savePreset(), but it forces the index to -1 so that the save will result in an "add" on the server */
    addPreset(preset: Preset): Observable<any> {
        preset.setWillSaveNewPreset();
        return this.savePreset(preset, true);
    }

    savePreset(preset: Preset, mustBeAddition: boolean = false): Observable<any> {
        // An existing preset? in a memory slot?
        return Observable.create((observable) => {
            let addingNewPreset = preset.index < 0;

            if (!addingNewPreset && mustBeAddition) {
                observable.error("Asked to add preset, but it has an index of " + preset.index + ". This would result in an overwrite.");
                return;
            }

            let putURL = addingNewPreset ? this.getChargerURL("/addpreset") : this.getChargerURL("/preset/" + preset.index);
            let body = preset.json();
            let action = addingNewPreset ? "Adding" : "Saving";
            console.log(action + " Preset: ", body);

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
                    let json = resp.json();
                    let sysObj = new System(json);
                    observable.next(sysObj);
                    observable.complete();
                }
            });
        });
    }

    saveSystem(system: System) {
        let headers = new Headers({'Content-Type': 'application/json'});
        let options = new RequestOptions({headers: headers});
        let operationURL = this.getChargerURL("/system");
        return Observable.create((observable) => {
            this.http.put(operationURL, system.json(), options).subscribe((resp) => {
                if (!resp.ok) {
                    observable.error(resp);
                } else {
                    observable.next(system);
                    observable.complete();
                }
            }, error => {
                observable.error(error);
            });
        });
    }

    cancelAutoStopForChannel(index: number) {
        if (this.autoStopSubscriptions[index]) {
            console.log("Cancelled auto-stop subscription for channel ", index);
            this.autoStopSubscriptions[index].unsubscribe();
            this.autoStopSubscriptions[index] = null;
        }
    }

    autoStopOnRunStatus(states_to_stop_on: [number], channel: Channel) {
        this.cancelAutoStopForChannel(channel.index);
        let channel_index = channel.index;

        this.autoStopSubscriptions[channel.index] = Observable.timer(250, 250)
            .takeUntil(this.ngUnsubscribe)
            .takeWhile(() => {
                let ch: Channel = this.getCharger().channels[channel_index];
                // console.log("Channel ", ch.index, ", state: ", ch.runState);
                return !states_to_stop_on.some((state) => {
                    return ch.runState == state;
                });
            })
            .subscribe((value) => {
            }, (error) => {
                console.log("Error while waiting for the channel to change state:", error);
                this.cancelAutoStopForChannel(channel.index);
            }, () => {
                if (this.getConfig().vibrateWhenDone) {
                    this.vibrateTaskDone();
                }
                console.log("Sending stop to channel ", channel.index, " because auto-stop condition was met");
                this.stopCurrentTask(channel).subscribe();
                this.cancelAutoStopForChannel(channel.index);
            });
    }

    vibrateTaskDone() {
        this.vibration.vibrate(1000);
    }
}

