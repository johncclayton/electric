import {Component, ViewChild} from "@angular/core";
import {Platform, Nav} from "ionic-angular";
import {StatusBar, Splashscreen} from "ionic-native";
import {Configuration} from "../services/configuration.service";
import {HomePage} from "../pages/home/home";
import {ConfigPage} from "../pages/config/config";
import {iChargerService} from "../services/icharger.service";


@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) nav: Nav;
    rootPage = HomePage;
    pages: Array<{title: string, component: any}>;

    constructor(platform: Platform,
                public chargerService: iChargerService,
                public config: Configuration) {

        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            console.log("have service: ", this.chargerService);
            StatusBar.styleDefault();
            Splashscreen.hide();

            // Load and wait for config, the potentially enter the config page.
        });

        this.pages = [
            // {title: 'Dashboard', component: HomePage},
            {title: 'Config', component: ConfigPage},
        ]
    }

    openPage(page) {
        // Reset the content nav to have just this page
        // we wouldn't want the back button to show in this scenario
        this.nav.push(page.component);
    }
}
