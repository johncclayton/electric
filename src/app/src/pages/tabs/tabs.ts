import {Component} from "@angular/core";
import {HomePage} from "../home/home";
import {ConfigPage} from "../config/config";
import {Configuration} from "../../services/configuration.service";

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  // this tells the tabs component which Pages
  // should be each tab's root Page
  tab1Root: any = HomePage;
  tab2Root: any = ConfigPage;

  public constructor(public config : Configuration) {

  }

  ionViewWillEnter() {
  }

  startingTab() {
    if(this.config.isNew()) {
      console.log("Looks like your first time - entering configuration");
      return 1;
    } else {
      console.log("Not first time, trying to connect...");
    }
    return 0;
  }

}
