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
import {IConfig, INetwork} from "../models/state/reducers/configuration";
import {IChargerState} from "../models/state/reducers/charger";
import {Vibration} from "@ionic-native/vibration";
import {Subject} from "rxjs/Subject";
import {LocalNotifications} from "@ionic-native/local-notifications";
import {IUIState} from "../models/state/reducers/ui";
import {ConfigurationActions} from "../models/state/actions/configuration";

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

    private lastUsedIPAddressIndex = 0;

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();

        this.cancelAutoStopForChannel(0);
        this.cancelAutoStopForChannel(1);
    }

    public constructor(public http: Http,
                       public vibration: Vibration,
                       public uiActions: UIActions,
                       private ngRedux: NgRedux<IAppState>,
                       private chargerActions: ChargerActions,
                       private configActions: ConfigurationActions,
                       private localNotifications: LocalNotifications,) {

        this.lastUsedIPAddressIndex = 0;
        this.startPollingCharger();

        // NOTE:
        // do not access ngRedux here. It'll be nil.
    }

    public stopAllPolling() {
        console.log("Stopping all polling....");
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.ngUnsubscribe = new Subject<void>();
    }

    public startPollingCharger() {
        console.log("Start polling for charger state...");
        this.getChargerStatus()
            .takeUntil(this.ngUnsubscribe)
            .subscribe(status => {
                // console.log("Refreshed from charger...");
            }, null, () => {
                console.log("Stopped polling for charger state")
            });
    }

    public startPollingStatusServer() {
        console.log("Starting polling for network status....");
        this.getServerStatus()
            .takeUntil(this.ngUnsubscribe)
            .subscribe(status => {
                // console.log("Network update from server...");
            }, null, () => {
                console.log("Stopped polling for network/server status")
            });
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

        return Observable.timer(10, interval)
            .flatMap(v => {
                // If disconnected, do a round robbin between various known IP addresses
                this.tryNextInterfaceIfDisconnected();

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

    public static getHostNameUsingConfigAndState(config: IConfig, ui: IUIState, port: number) {
        // If on index 0, use private WLAN address
        if (config.lastConnectionIndex == 0) {
            return "192.168.10.1:" + port;
        }

        // If disconnected, do a round robbin between various known IP addresses
        return config.ipAddress + ":" + port;
    }

    getHostName(): string {
        let config = this.getConfig();
        let state = this.ngRedux.getState();
        return iChargerService.getHostNameUsingConfigAndState(config, state.ui, config.port);
    }

    getManagementHostName(): string {
        let config = this.getConfig();
        let state = this.ngRedux.getState();
        return iChargerService.getHostNameUsingConfigAndState(config, state.ui, 4999);
    }

    // Gets the status of the charger
    private getChargerURL(path) {
        return "http://" + this.getHostName() + path;
    }

    private getManagementURL(path) {
        return "http://" + this.getManagementHostName() + path;
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

    startCharge(channel: Channel, preset: Preset, operationPlan: string): Observable<any> {
        this.autoStopOnRunStatus([40], channel, operationPlan);
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

    startDischarge(channel: Channel, preset: Preset, operationPlan: string): Observable<any> {
        this.autoStopOnRunStatus([40], channel, operationPlan);
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

    startStore(channel: Channel, preset: Preset, operationPlan: string) {
        this.autoStopOnRunStatus([40], channel, operationPlan);
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

    startBalance(channel: Channel, preset: Preset, operationPlan: string) {
        this.autoStopOnRunStatus([40], channel, operationPlan);
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

    autoStopOnRunStatus(states_to_stop_on: [number], channel: Channel, operationPlan: string = null) {
        // 41 seems to be the error state.
        // Always listen for that...
        states_to_stop_on.push(41);

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
                this.cancelAutoStopForChannel(channel_index);
            }, () => {
                let ch: Channel = this.getCharger().channels[channel_index];
                if (ch.runState == 41) {
                    // Error!
                    this.chargerActions.setErrorOnChannel(ch.index, "Error");
                } else {
                    this.stopCurrentTask(ch).subscribe();
                }
                this.sendCompletionNotifications(ch, operationPlan);
                this.cancelAutoStopForChannel(ch.index);
            });
    }

    private sendCompletionNotifications(channel: Channel, operationName: string) {
        console.log("Sending stop to channel ", channel.index, " because auto-stop condition was met. Run state = " + channel.runState, "Operation: " + operationName);

        if (this.getConfig().vibrateWhenDone) {
            this.vibrateTaskDone();
        }

        if (this.getConfig().notificationWhenDone) {
            this.notificationWhenDone(operationName);
        }
    }

    vibrateTaskDone() {
        this.vibration.vibrate(1000);
    }

    notificationWhenDone(operationName: string) {
        this.localNotifications.schedule({
            id: 1,
            text: operationName + ", finished"
        });
    }

    /*
    This has to be here, because it uses some built in state
     */
    setChargeConfiguration(key: string, value: any) {
        let change = [];
        change[key] = value;
        this.ngRedux.dispatch({
            type: ConfigurationActions.UPDATE_CHARGE_CONFIG_KEYVALUE,
            payload: change,
            maxAmpsPerChannel: this.getMaxAmpsPerChannel()
        });
    }


    public updateWifi(ssid: string, password: string) {
        // this.configActions.setConfiguration("homeLanConnecting", true);
        //
        // Observable.create((observable) => {
        //     let wifiURL = this.getManagementURL("/wifi");
        //     let payload = {
        //         "SSID": ssid,
        //         "PWD": password
        //     };
        //
        //     let headers = new Headers({'Content-Type': 'application/json'});
        //     let options = new RequestOptions({headers: headers});
        //
        //     let body = JSON.stringify(payload);
        //     console.log("Sending: ", body, "to", wifiURL);
        //     this.http.put(wifiURL, body, options).subscribe((resp) => {
        //             if (resp.ok) {
        //                 console.log("Yay. It worked");
        //             }
        //         }, (e) => {
        //
        //         }, () => {
        //             this.configActions.setConfiguration("homeLanConnecting", false);
        //             this.detectWifiConnectionStatus();
        //         }
        //     );
        // }).subscribe()
    }

    private getServerStatus(): Observable<any> {
        let interval = 1500;
        return Observable.timer(10, interval).flatMap(v => {
            // If disconnected, do a round robbin between various known IP addresses
            this.tryNextInterfaceIfDisconnected();

            let wifiURL = this.getManagementURL("/status");
            // console.log("Get status from " + wifiURL);
            return this.http.get(wifiURL);
        }).map(resp => {
            if (resp.ok) {
                let json = resp.json();
                let access_point = json["access_point"];
                let interfaces = json["interfaces"];
                let docker = json["docker"];
                let server = json["server_status"];
                let services = json["services"];

                let new_values = {
                    ap_associated: false,
                    ap_channel: access_point.channel,
                    ap_name: access_point.name,
                    wifi_ssid: access_point.wifi_ssid,
                };

                if (docker.hasOwnProperty('last_deploy')) {
                    new_values['docker_last_deploy'] = docker['last_deploy'];
                }
                if (docker.hasOwnProperty('web')) {
                    new_values['web_running'] = docker['web'].container_running;
                }
                if (docker.hasOwnProperty('worker')) {
                    new_values['worker_running'] = docker['worker'].container_running;
                }

                if (server.hasOwnProperty('exception')) {
                    // SERVER ISNT RUNNING?
                } else if (server.hasOwnProperty('charger_presence')) {
                    // SERVER IS RUNNING OK
                }

                let ssid_length = new_values.ap_name.length;

                for (let interface_name of Object.keys(interfaces)) {
                    let interface_ip: string = interfaces[interface_name];
                    if (interface_name == "wlan0") {
                        if (interface_ip.length > 0) {
                            new_values.ap_associated = ssid_length > 0;
                        }
                    }
                    new_values['interfaces'] = interfaces;
                    new_values['services'] = services;
                }

                this.configActions.updateConfiguration({
                    network: new_values,
                });

                let state = this.ngRedux.getState();
                if (state.ui.disconnected) {
                    this.uiActions.serverReconnected();
                }
            } else {
                this.uiActions.setDisconnected();
            }
        }).catch(e => {
            console.error("Error getting server status: " + e);
            this.uiActions.setDisconnected();
            return Observable.throw(e);
        }).retry();
    }

    private tryNextInterfaceIfDisconnected() {
        let state = this.ngRedux.getState();
        if (state.ui.disconnected) {
            let config = this.getConfig();
            config.lastConnectionIndex = (config.lastConnectionIndex + 1) % 2;
            console.log("Switch to connection index: ", config.lastConnectionIndex);
        }
    }
}

