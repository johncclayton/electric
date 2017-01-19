import {Injectable} from "@angular/core";
import {Storage} from "@ionic/storage";
import {AlertController, Events} from "ionic-angular";

const CONFIG_LOADED_EVENT = "config.loaded";
const CONFIG_CHANGED_EVENT = "config.changed";

@Injectable()
export class Configuration {
    public configDict = {};

    public constructor(public storage: Storage,
                       public events: Events,
                       public alert: AlertController) {
    }

    loadConfiguration(): Promise<any> {
        this.setConfigToDefaults();

        return new Promise((resolve, reject) => {
            this.storage.get("configuration")
                .then(v => {
                    this.bringInConfiguration(v);
                    console.log("Configuration Loaded: ", this.configDict);
                    this.events.publish(CONFIG_LOADED_EVENT);
                    resolve();
                })
        });

    }

    bringInConfiguration(configurationObject) {
        // Overwrite defaults with what's in the store
        let savedConfiguration = JSON.parse(configurationObject);
        this.overrideDictionary("", this.configDict, savedConfiguration);
        // console.log("Final configuration: ", this.configDict);
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

    getHostName(): string {
        return this.configDict["ipAddress"] + ":" + this.configDict["port"];
    }

    // Has this been configured before?
    isNew(): boolean {
        return this.configDict["isnew"];
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
}

export {
    CONFIG_CHANGED_EVENT, CONFIG_LOADED_EVENT
}
