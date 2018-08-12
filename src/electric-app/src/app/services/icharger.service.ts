import {EventEmitter, Injectable, NgZone} from '@angular/core';
import {Observable, of, pipe, range, Subject, throwError, timer} from 'rxjs';
import {Preset} from '../models/preset-class';
import {Channel} from '../models/channel';
import {System} from '../models/system';
import {NgRedux} from '@angular-redux/store';
import {IAppState} from '../models/state/configure';
import {ChargerActions} from '../models/state/actions/charger';
import {UIActions} from '../models/state/actions/ui';
import {IConfig} from '../models/state/reducers/configuration';
import {IChargerState} from '../models/state/reducers/charger';
import {ConfigurationActions} from '../models/state/actions/configuration';
import {ElectricNetworkService} from './network.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {
    catchError,
    delay,
    flatMap,
    map,
    mergeMap,
    repeatWhen,
    retry,
    retryWhen,
    take,
    takeUntil,
    takeWhile,
    tap,
    zip
} from 'rxjs/operators';
import {Vibration} from '@ionic-native/vibration/ngx';
import {LocalNotifications} from '@ionic-native/local-notifications/ngx';
import {URLService} from './url.service';

export enum ChargerType {
    iCharger4010Duo = 64,
    iCharger308Duo = 66,
    iCharger406Duo = 67 // ??? probably not. We need to get the model number.
}

const backoff = (maxTries, ms) => {
    return pipe(
        retryWhen(attempts => range(1, maxTries)
            .pipe(
                zip(attempts, (i) => i),
                map(i => i * i),
                mergeMap(i => timer(i * ms))
            ))
    );
};

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

@Injectable({
    providedIn: 'root'
})
export class iChargerService {
    autoStopSubscriptions: any[] = [];
    serverReconnection: EventEmitter<any> = new EventEmitter();

    private static device_id: number;

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private lastUsedIPAddressIndex = 0;
    private firstRun: boolean;

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();

        this.cancelAutoStopForChannel(0);
        this.cancelAutoStopForChannel(1);
    }

    public constructor(public http: HttpClient,
                       public url: URLService,
                       private zone: NgZone,
                       public vibration: Vibration,
                       public uiActions: UIActions,
                       private ngRedux: NgRedux<IAppState>,
                       private networkService: ElectricNetworkService,
                       private chargerActions: ChargerActions,
                       private configActions: ConfigurationActions,
                       private localNotifications: LocalNotifications,) {

        this.firstRun = true;
        this.lastUsedIPAddressIndex = 0;
        this.startPollingCharger();

        // NOTE:
        // do not access ngRedux here. It'll be nil.
    }

    public stopAllPolling() {
        console.log('Stopping all polling....');
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.ngUnsubscribe = new Subject<void>();
    }

    public startPollingCharger() {
        console.log('Start polling for charger state...');
        this.uiActions.setConfiguringNetwork(false);

        this.runOutsideAngular(() => {
            /*
            Poll. Try. Wait one second between requests, try again.
            If don't get a response in T, cancel outstanding XHR, wait one second, try again.
            If disconnected, do a round robbin between various known IP addresses. Try the previous address FIRST.
             */
            let numberErrors = 0;
            timer(0, 1000).pipe(
                flatMap(() => {
                    return this.getChargerStatus();
                }),
                takeUntil(this.ngUnsubscribe),
                retryWhen(errors => {
                    return errors.pipe(
                        tap((v) => {
                            numberErrors++;
                            if (v['name'] != 'TimeoutError') {
                                if (numberErrors % 10 == 0)
                                    console.error(`Error (retry) while polling for charger state: ${JSON.stringify(v)}...`);
                                // Always set disconnected state if its not a timeout
                                this.uiActions.setDisconnected();
                            } else {
                                console.warn(`Timeout while getting status... will retry...`);
                                if (numberErrors > 1) {
                                    // this will begin round robin
                                    this.uiActions.setDisconnected();
                                }
                            }
                        }),
                        delay(numberErrors > 1 ? 2000 : 1000)
                    );
                }),
                repeatWhen(thing => {
                    return of(true).pipe(delay(1000));
                })
            ).subscribe(status => {
                console.log('Refreshed status from charger...');
                numberErrors = 0;
            }, (err) => {
                console.error(`Error while polling for charger state: ${JSON.stringify(err)}. POLLING STOPPED.`);
            }, () => {
                console.log('Finished poll for charger state. Polling stopped.');
            });
        });
    }

    public startPollingStatusServer() {
        console.log('Starting polling for network status....');
        this.uiActions.setConfiguringNetwork(true);
        this.runOutsideAngular(() => {
            this.getServerStatus().pipe(
                takeUntil(this.ngUnsubscribe)
            ).subscribe(status => {
                // console.log("Network update from server...");
            }, null, () => {
                console.log('Stopped polling for network/server status');
            });
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
        let result = !haveNetwork || !haveCharger || !haveServer;
        if (result) {
            console.debug(`haveNetwork: ${haveNetwork}, haveCharger: ${haveCharger}, haveServer: ${haveServer}`);
        }
        return result;
    }

    // noinspection JSMethodCanBeStatic
    isNetworkAvailable(): boolean {
        // TODO: Make this smarter
        return true;
    }

    getNumberOfChannels(): number {
        return this.getCharger().channel_count;
    }

    getPresets(retryTimes = 5): Observable<any> {
        let numberOfErrors = 0;
        return this.runOutsideAngular(() => {
            return timer(0, 1000).pipe(
                flatMap(() => {
                    let url = this.url.getChargerURL('/preset');
                    this.logActionIfDisconnected(url, true);
                    return this.http.get(url, {headers: this.getHttpOptions()});
                }),
                retryWhen(errors$ => {
                    return errors$.pipe(
                        tap((err) => {
                            numberOfErrors++;
                            this.uiActions.setDisconnected();
                            console.error(`Presets error #${numberOfErrors}: ${JSON.stringify(err)}`);
                        }),
                        flatMap(err => {
                            if (numberOfErrors > retryTimes) {
                                // fail
                                console.error(`Terminating, at max num errors`);
                                return throwError(err);
                            }
                            console.error(`presets will retry in 1s`);
                            return of(true);
                        }),
                        delay(1000)
                    );
                }),
                map((arrayOfPresets: any[]) => {
                    // This should be a list of presets
                    let presetList = [];
                    for (let presetDict of arrayOfPresets) {
                        presetList.push(new Preset(presetDict));
                    }
                    numberOfErrors = 0;
                    return presetList;
                }),
                take(1)
            );
        });
    }

    getChargerStatus(timeout: number = 3000): Observable<any> {
        return of(true).pipe(
            flatMap(v => {
                this.tryNextInterfaceIfDisconnected();

                let url = this.url.getChargerURL('/unified');
                this.logActionIfDisconnected(url);
                this.firstRun = false;
                return this.http.get(url, {headers: this.getHttpOptions(timeout)});
            }),
            map(resp => {
                // Update device ID
                this.chargerActions.refreshStateFromCharger(resp);
                this.notifyOfReconnection();
            })
        );
    }

    private logActionIfDisconnected(url, force: boolean = false) {
        let state = this.ngRedux.getState();
        if (state.ui.disconnected || force) {
            console.log(`Trying ${url}`);
        }
    }

    private notifyOfReconnection() {
        let state = this.ngRedux.getState();
        iChargerService.device_id = state.charger.device_id;
        if (state.ui.disconnected) {
            this.uiActions.serverReconnected();
            this.serverReconnection.emit();
        }
    }

    static lookupChargerMetadata(deviceId = null, propertyName = 'name', defaultValue = null) {
        // Not supplied? Look it up.
        if (!deviceId) {
            return defaultValue;
        }
        if (deviceId) {
            let md = ChargerMetadata[deviceId];
            if (md !== undefined) {
                if (md[propertyName] !== undefined) {
                    return md[propertyName];
                }
            }
        }
        return defaultValue;
    }

    static getMaxAmpsPerChannel() {
        return iChargerService.lookupChargerMetadata(iChargerService.device_id, 'maxAmps', 15);
    }

    static getChargerName() {
        return iChargerService.lookupChargerMetadata(iChargerService.device_id, 'name', 'iCharger');
    }

    static getChargerTag() {
        return iChargerService.lookupChargerMetadata(iChargerService.device_id, 'tag', '');
    }

    static getMaxCells() {
        return iChargerService.lookupChargerMetadata(iChargerService.device_id, 'cells', 0);
    }

    stopCurrentTask(channel: Channel): Observable<any> {
        this.cancelAutoStopForChannel(channel.index);
        console.log('Stopping current task...');
        let url = this.url.getChargerURL('/stop/' + channel.index);
        return this.runOutsideAngular(() => {
            return this.http.put(url, '', this.putJsonOptions);
        });
    }

    /* Same as savePreset(), but it forces the index to -1 so that the save will result in an "add" on the server */
    addPreset(preset: Preset): Observable<any> {
        preset.setWillSaveNewPreset();
        return this.savePreset(preset, true);
    }

    savePreset(preset: Preset, mustBeAddition: boolean = false): Observable<any> {
        // An existing preset? in a memory slot?
        let addingNewPreset = preset.index < 0;

        if (!addingNewPreset && mustBeAddition) {
            return throwError('Asked to add preset, but it has an index of ' + preset.index + '. This would result in an overwrite.');
        }

        let putURL = addingNewPreset ? this.url.getChargerURL('/addpreset') : this.url.getChargerURL('/preset/' + preset.index);
        let body = preset.json();
        let action = addingNewPreset ? 'Adding' : 'Saving';
        console.log(action + ' Preset: ', body);

        return this.runOutsideAngular(() => {
            return this.http.put(putURL, body, this.putJsonOptions).pipe(
                map(resp => {
                    // Expect a copy of the modified preset?
                    // If we were adding, the preset is returned. If we're saving, it isn't.
                    // At the moment, it just returns "ok"

                    if (addingNewPreset) {
                        // Return the newly saved preset, with its new memory slot (index)
                        return new Preset(resp);
                    } else {
                        // Just return the modified preset, that the user just saved
                        return preset;
                    }
                }),
                catchError(error => {
                    this.uiActions.setErrorMessage(`Can't save: ${error}`);
                    return throwError(error);
                })
            );
        });
    }

    runOutsideAngular(funcThing): any {
        return this.zone.runOutsideAngular(funcThing);
    }

    startCharge(channel: Channel, preset: Preset, operationPlan: string): Observable<any> {
        this.autoStopOnRunStatus([40], channel, operationPlan);
        let operationURL = this.url.getChargerURL('/charge/' + channel.index + '/' + preset.index);
        console.log('Beginning charge on channel ', channel.index, ' using preset at slot ', preset.index);
        return this.runOutsideAngular(() => {
            return this.http.put(operationURL, null, this.putJsonOptions);
        });
    }

    startDischarge(channel: Channel, preset: Preset, operationPlan: string): Observable<any> {
        this.autoStopOnRunStatus([40], channel, operationPlan);
        let operationURL = this.url.getChargerURL('/discharge/' + channel.index + '/' + preset.index);
        console.log('Beginning discharge on channel ', channel.index, ' using preset at slot ', preset.index);
        return this.runOutsideAngular(() => {
            return this.http.put(operationURL, null, this.putJsonOptions);
        });
    }

    startStore(channel: Channel, preset: Preset, operationPlan: string) {
        this.autoStopOnRunStatus([40], channel, operationPlan);
        let operationURL = this.url.getChargerURL('/store/' + channel.index + '/' + preset.index);
        console.log('Beginning storage on channel ', channel.index, ' using preset at slot ', preset.index);
        return this.runOutsideAngular(() => {
            return this.http.put(operationURL, '', this.putJsonOptions);
        });
    }

    startBalance(channel: Channel, preset: Preset, operationPlan: string) {
        this.autoStopOnRunStatus([40], channel, operationPlan);
        let operationURL = this.url.getChargerURL('/balance/' + channel.index + '/' + preset.index);
        console.log('Beginning balance on channel ', channel.index, ' using preset at slot ', preset.index);
        return this.runOutsideAngular(() => {
            return this.http.put(operationURL, '', this.putJsonOptions);
        });
    }

    measureIR(channel: Channel) {
        let operationURL = this.url.getChargerURL('/measureir/' + channel.index);
        console.log('Beginning IR measurement on channel ', channel.index);
        return this.runOutsideAngular(() => {
            return this.http.put(operationURL, '', this.putJsonOptions);
        });
    }

    getSystem(): Observable<System> {
        let operationURL = this.url.getChargerURL('/system');
        return this.runOutsideAngular(() => {
            return this.http.get(operationURL).pipe(
                map(resp => new System(resp))
            );
        });
    }

    getHttpOptions(timeout: number = 3000) {
        return new HttpHeaders({timeout: `${timeout}`});
    }

    get putJsonOptions() {
        return {headers: new HttpHeaders({'Content-Type': 'application/json'})};
    }

    saveSystem(system: System) {
        let operationURL = this.url.getChargerURL('/system');
        return this.runOutsideAngular(() => {
            return this.http.put(operationURL, system.json(), this.putJsonOptions);
        });
    }

    cancelAutoStopForChannel(index: number) {
        if (this.autoStopSubscriptions[index]) {
            console.log('Cancelled auto-stop subscription for channel ', index);
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

        this.autoStopSubscriptions[channel.index] =
            this.runOutsideAngular(() => {
                timer(250, 250).pipe(
                    takeUntil(this.ngUnsubscribe),
                    takeWhile(() => {
                        let ch: Channel = this.getCharger().channels[channel_index];
                        // console.log("Channel ", ch.index, ", state: ", ch.runState);
                        return !states_to_stop_on.some((state) => {
                            return ch.runState == state;
                        });
                    }),
                ).subscribe(() => {
                }, (error) => {
                    console.log('Error while waiting for the channel to change state:', error);
                    this.cancelAutoStopForChannel(channel_index);
                }, () => {
                    let ch: Channel = this.getCharger().channels[channel_index];
                    if (ch.runState == 41) {
                        // Error!
                        this.chargerActions.setErrorOnChannel(ch.index, 'Error');
                    } else {
                        this.stopCurrentTask(ch).subscribe();
                    }
                    this.sendCompletionNotifications(ch, operationPlan);
                    this.cancelAutoStopForChannel(ch.index);
                });
            });
    }

    private sendCompletionNotifications(channel: Channel, operationName: string) {
        console.log('Sending stop to channel ', channel.index, ' because auto-stop condition was met. Run state = ' + channel.runState, 'Operation: ' + operationName);

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
            text: operationName + ', finished'
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
            maxAmpsPerChannel: iChargerService.getMaxAmpsPerChannel()
        });
    }


    public updateWifi(ssid: string, password: string): Observable<any> {
        return this.runOutsideAngular(() => {
            return Observable.create((observable) => {
                let wifiURL = this.url.getManagementURL('/wifi');
                let payload = {
                    'SSID': ssid,
                    'PWD': password
                };
                // console.log("Sending: ", body, "to", wifiURL);
                return this.runOutsideAngular(() => {
                    return this.http.put(wifiURL, payload, this.putJsonOptions);
                });
            });
        });
    }

    private getServerStatus(): Observable<any> {
        let interval = 1500;
        return this.runOutsideAngular(() => {
            return timer(10, interval).pipe(
                flatMap(v => {
                    // If disconnected, do a round robbin between various known IP addresses
                    this.tryNextInterfaceIfDisconnected();
                    this.networkService.fetchCurrentIPAddress();

                    let wifiURL = this.url.getManagementURL('/status');
                    // console.log("Get status from " + wifiURL);
                    return this.http.get(wifiURL);
                }),
                map(json => {
                    let access_point = json['access_point'];
                    let interfaces = json['interfaces'];
                    let docker = json['docker'];
                    let server = json['server_status'];
                    let services = json['services'];

                    let new_values = {
                        ap_associated: false,
                        ap_channel: access_point.channel,
                        ap_name: access_point.name,
                    };

                    let current_network = this.ngRedux.getState().config.network;
                    let havnt_had_update_yet = current_network.last_status_update == null;
                    let update_is_old = false;
                    if (havnt_had_update_yet == false) {
                        let right_now: Date = new Date();
                        let diff_in_ms = right_now.getTime() - current_network.last_status_update.getTime();
                        update_is_old = diff_in_ms > 10000;
                    }
                    if (havnt_had_update_yet || update_is_old) {
                        new_values['wifi_ssid'] = access_point.wifi_ssid;
                    }

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
                        if (interface_name == 'wlan0') {
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
                }),
                catchError(e => {
                    console.error('Error getting server status: ' + e);
                    this.uiActions.setDisconnected();
                    return throwError(e);
                }),
                retry()
            );
        });
    }

    private get isDisconnected() {
        let state = this.ngRedux.getState();
        return state.ui.disconnected && !this.firstRun;
    }

    private tryNextInterfaceIfDisconnected() {
        if (this.isDisconnected) {
            let config = this.getConfig();
            config.lastConnectionIndex = (config.lastConnectionIndex + 1) % 2 || 0;
            console.debug(`Switch to connection index: ${config.lastConnectionIndex}. Next URL: ${this.url.getHostName()}`);
            this.uiActions.setDisconnected();
        }
    }
}

