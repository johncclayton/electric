import {Component} from '@angular/core';

import {NavController} from 'ionic-angular';
import {Configuration} from "../../services/configuration.service";

@Component({
  selector: 'page-config',
  templateUrl: 'config.html'
})
export class ConfigPage {

  constructor(public navCtrl: NavController, public config: Configuration) {

  }

  ionViewWillLeave() {
    console.log("Leaving config view. Saving config.");
    this.config.saveConfiguration();
  }

  resetToDefaults() {
    this.config.resetToDefaults();
  }
}
