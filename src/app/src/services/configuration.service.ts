import {Injectable} from "@angular/core";
import {Storage} from "@ionic/storage";
import {AlertController, Events, Platform, ToastController, LoadingController} from "ionic-angular";
import {Deploy} from "@ionic/cloud-angular";
import {iChargerService} from "./icharger.service";

const CONFIG_LOADED_EVENT = "config.loaded";
const CONFIG_CHANGED_EVENT = "config.changed";

@Injectable()
export class Configuration {
    public configDict = {};
    private versionNumber: string;
    private versionUUID: string;

    public constructor(public storage: Storage,
                       public events: Events,
                       public platform: Platform,
                       public deploy: Deploy,
                       public readonly toastController: ToastController,
                       public readonly loadingController: LoadingController,
                       public alert: AlertController) {
        this.versionNumber = "";
        this.versionUUID = "";
    }

    updateStateFromCharger(chargerService: iChargerService) {
        console.info("Updating config with values from charger...");
        chargerService.getSystem().subscribe((system) => {
            this.configDict['unitsCelsius'] = system.isCelsius;
        });
    }

    loadConfiguration(): Promise<any> {
        this.setConfigToDefaults();

        return new Promise((resolve, reject) => {
            this.storage.get("configuration")
                .then(v => {
                    this.bringInConfiguration(v);

                    // The main app waits on this.
                    // It doesn't really start until this fires...
                    resolve();

                    this.checkForUpdateIfCanOnThisPlatform();

                    console.log("Configuration loaded from storage");
                    this.events.publish(CONFIG_LOADED_EVENT);
                })
        });
    }

    bringInConfiguration(configurationObject) {
        // Overwrite defaults with what's in the store
        let savedConfiguration = JSON.parse(configurationObject);
        this.overrideDictionary("", this.configDict, savedConfiguration);
    }

    private overrideDictionary(root, destinationDict, jsonObject) {
        for (let key in jsonObject) {
            if (jsonObject.hasOwnProperty(key)) {
                let value = jsonObject[key];
                if (value.constructor == Object) {
                    // Recurse
                    console.log(` - entering: ${key}`);
                    this.overrideDictionary(root + key + ".", destinationDict[key], value);
                } else {
                    console.log(` - config: ${root}${key} = ${value}`);
                    destinationDict[key] = value;
                }
            }
        }
    }

    getCellLimit() {
        return this.configDict['cellLimit'];
    }

    getIsUsingMockCharger() {
        return this.configDict['mockCharger'];
    }

    getHostName(): string {
        return this.configDict["ipAddress"] + ":" + this.configDict["port"];
    }

    // Has this been configured before?
    isNew(): boolean {
        return this.configDict["isnew"];
    }

    isCelsius(): boolean {
        return this.configDict['unitsCelsius'];
    }

    preventChargerVerticalScrolling(): boolean {
        return this.configDict['preventChargerVerticalScrolling'];
    }

    saveConfiguration() {
        let json = JSON.stringify(this.configDict);

        if (this.isNew()) {
            console.log("Configuration no longer new.");
            this.configDict["isnew"] = false;
        }

        this.storage.set("configuration", json).then(() => {
            console.log("Saved config: ", json);
        });
    }

    resetToDefaults() {
        this._resetToDefaults(true)
    };

    _resetToDefaults(resetAndSaveToStorage = true) {
        if (resetAndSaveToStorage) {
            // Confirm first
            let alertMessage = this.alert.create({
                title: 'Defaults will be reset',
                message: 'Are you sure?',
                buttons: [
                    {
                        text: 'No',
                        role: 'cancel'
                    },
                    {
                        text: 'Yes',
                        handler: () => {
                            console.log("Resetting config to defaults...");
                            this.setConfigToDefaults();
                            this.saveConfiguration();
                        }
                    }
                ]
            });
            alertMessage.present();
        } else {
            this.saveConfiguration();
        }
    }

    setConfigToDefaults() {
        this.configDict = {
            "ipAddress": "localhost",
            "port": "5000",
            "isnew": true,
            "cellLimit": -1,
            "preventChargerVerticalScrolling": true,
            "unitsCelsius": true,
            "mockCharger": false,
            "charge": {
                "capacity": 2000,
                "c": 2,
                "numPacks": 4,
                "chemistryFilter": "All",
                "chargeMethod": "presets",
            }
        };
    }

    canUseDeploy(): boolean {
        return this.platform.is('cordova');
    }

    platformsString(): string {
        return this.platform.platforms().toString();
    }

    versionNumberString(): string {
        if (this.canUseDeploy()) {
            let ver: string = "";
            if (this.versionNumber) {
                ver += this.versionNumber;
            }
            if (this.versionUUID) {
                ver += " (" + this.versionUUID + ")";
            }
            if (ver.length > 0) {
                return ver;
            }
            return "0.0.1";
        }
        return "";
    }

    /*
     Upgrading
     */

    private checkForUpdateIfCanOnThisPlatform() {
        console.log("Platforms: ", this.platform.platforms());
        if (this.canUseDeploy()) {
            console.log("Finding current deploy info...");
            this.deploy.info().then(v => {
                this.versionNumber = "";
                let keys = Object.keys(v);

                keys.forEach((key, index) => {
                    if (key == 'binary_version') {
                        this.versionNumber = v[key];
                    }
                    if (key == "deploy_uuid") {
                        this.versionUUID = v[key];
                    }
                });

                this.checkForUpdate();
            });
        } else {
            console.log("Can't use deploy - so not trying to see what version we are");
        }
    }

    checkForUpdate() {
        if (!this.canUseDeploy()) {
            console.log("Not checking for latest version, we can't use Deploy (prob in browser)");
            return;
        }

        console.log("Checking for update...");
        const checking = this.loadingController.create({
            content: 'Checking for update...'
        });
        checking.present();

        this.deploy.check().then((snapshotAvailable: boolean) => {
            checking.dismiss();
            if (snapshotAvailable) {
                this.downloadAndInstall();
            }
            else {
                const toast = this.toastController.create({
                    message: 'Using latest version',
                    duration: 3000
                });
                toast.present();
            }
        });
    }

    private downloadAndInstall() {
        const updating = this.loadingController.create({
            content: 'Updating application...'
        });
        updating.present();
        this.deploy.download().then(() => this.deploy.extract()).then(() => this.deploy.load());
    }
}

export {
    CONFIG_CHANGED_EVENT, CONFIG_LOADED_EVENT
}
