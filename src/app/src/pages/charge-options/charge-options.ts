import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {Channel} from "../../models/channel";
import {iChargerService} from "../../services/icharger.service";
import {ChemistryType, Preset} from "../preset/preset-class";
import {Chemistry} from "../../utils/mixins";
import {Configuration} from "../../services/configuration.service";

import * as _ from "lodash";
import {sprintf} from "sprintf-js";
import {applyMixins} from "rxjs/util/applyMixins";

@Component({
    selector: 'page-charge-options',
    templateUrl: 'charge-options.html'
})
export class ChargeOptionsPage implements Chemistry {
    channel: Channel;
    channelLimitReached: boolean = false;
    presets: Array<any> = [];

    constructor(public navCtrl: NavController,
                public chargerService: iChargerService,
                public config: Configuration,
                public navParams: NavParams) {
        this.channel = navParams.data;
    }

    ionViewDidLoad() {
        this.chargerService.getPresets().subscribe((presetList) => {
            this.presets = presetList;
        });
        this.recomputeLimitReached();
    }

    get chargeMethod(): string {
        return this.getChargeProperty('chargeMethod');
    }

    set chargeMethod(value) {
        this.setChargeProperty('chargeMethod', value);
    }

    get chemistryFilter(): string {
        return this.getChargeProperty('chemistryFilter');
    }

    set chemistryFilter(value) {
        this.setChargeProperty('chemistryFilter', value);
    }

    get capacity() {
        return this.getChargeProperty('capacity');
    }

    set capacity(value) {
        this.setChargeProperty('capacity', value);
    }

    get chargeRate() {
        return this.getChargeProperty('c');
    }

    get chargeRateTimesTen() {
        return this.chargeRate * 10;
    }

    set chargeRateTimesTen(value) {
        this.chargeRate = value / 10.0;
    }

    set chargeRate(value) {
        this.setChargeProperty('c', value);
    }

    get numPacks() {
        return this.getChargeProperty('numPacks');
    }

    set numPacks(value) {
        this.setChargeProperty('numPacks', value);
    }

    get computedAmps() {
        return this.numPacks * (this.capacity / 1000) * this.chargeRate;
    }
    get amps() {
        return Math.min(this.computedAmps, this.chargerService.getMaxAmpsPerChannel());
    }

    showFlame() {
        return this.chargeRate >= 5.0;
    }

    chargePlan() {
        return "Charge at " + sprintf("%2.01fA", this.amps);
    }

    filteredPresets() {
        let presets = this.presets.filter((preset) => {
            let filter = this.chemistryFilter;
            if (filter == Preset.chemistryPrefix(ChemistryType.Anything)) {
                return true;
            }
            return Preset.chemistryPrefix(preset.type) == filter;
        });
        return _.chunk(presets, 3);
    }

    chemistryClass: () => string;

    private getChargeProperty(propertyName: string) {
        return this.config.configDict['charge'][propertyName];
    }

    private setChargeProperty(propertyName: string, newValue: any) {
        this.config.configDict['charge'][propertyName] = newValue;
        this.config.saveConfiguration();
        this.recomputeLimitReached();
    }

    private recomputeLimitReached() {
        this.channelLimitReached = this.computedAmps > this.ampsLimit();
    }

    private ampsLimit() {
        return this.chargerService.getMaxAmpsPerChannel();
    }
}

applyMixins(ChargeOptionsPage, [Chemistry]);
