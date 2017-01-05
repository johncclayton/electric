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
    // setup some defaults
    this.setConfigToDefaults();

    // Overwrite defaults with what's in the store
    this.storage.get("configuration").then((v) => {
      let savedConfiguration = JSON.parse(v);
      for (let key in savedConfiguration) {
        if (savedConfiguration.hasOwnProperty(key)) {
          let value = savedConfiguration[key];
          console.log(` - using config: ${key} = ${value}`);
          this.configDict[key] = value;
        }
      }
      console.log("Configuration Loaded: ", this.configDict);
      this.events.publish(CONFIG_LOADED_EVENT);
    });
  }

  getHostName(): string {
    return this.configDict["hostname"];
  }

  // Has this been configured before?
  isNew(): boolean {
    return this.configDict["isnew"];
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
      "hostname": "localhost:5000",
      "isnew": true,
    };
  }
}

export {
  CONFIG_CHANGED_EVENT, CONFIG_LOADED_EVENT
}
