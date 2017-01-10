import {Component, ViewChild} from "@angular/core";
import {Platform, Nav} from "ionic-angular";
import {StatusBar, Splashscreen} from "ionic-native";
import {Configuration} from "../services/configuration.service";
import {ConfigPage} from "../pages/config/config";
import {iChargerService} from "../services/icharger.service";
import {PresetListPage} from "../pages/preset-list/preset-list";
import {HomePage} from "../pages/home/home";


@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) nav: Nav;
    rootPage = HomePage;
    // rootPage = PresetListPage;
    pages: Array<{title: string, component: any}>;

    constructor(platform: Platform,
                public chargerService: iChargerService,
                public config: Configuration) {

        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            StatusBar.styleDefault();
            Splashscreen.hide();
        });

        this.pages = [
            {title: 'Presets', component: PresetListPage},
            {title: 'Config', component: ConfigPage},
        ]
    }

    openPage(page) {
        // Reset the content nav to have just this page
        // we wouldn't want the back button to show in this scenario
        this.nav.push(page.component);
    }

}
