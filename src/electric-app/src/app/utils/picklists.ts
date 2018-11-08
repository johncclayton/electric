import {BalanceEndCondition, RegenerativeMode, RegenerativeToChannelMethod} from '../models/preset-class';
import {celciusToF} from './helpers';
import {System} from '../models/system';
import {Injectable} from '@angular/core';

const kRegenName = 'regenOptions';
const kRegenMthod = 'regenMethod';
const kSafetyTempOptions = 'kSafetyTempOptions';
const kSafetyCapacity = 'kSafetyCapacity';

@Injectable({
    providedIn: 'root'
})
export class iChargerPickLists {
    private _lists: Map<string, Array<any>>;

    constructor() {
        this._lists = new Map<string, Array<any>>();

    }

    private getOrCreateNamedList(name: string): Array<any> {
        if (this._lists.has(name)) {
            return this._lists.get(name);
        }
        let newList = new Array();
        this._lists.set(name, newList);
        return newList;
    }

    private addToNamedList(name: string, aList: any[]) {
        let list = this.getOrCreateNamedList(name);
        aList.forEach(item => list.push(item));
    }

    private hasNamedList(name: string): boolean {
        return this._lists.has(name);
    }

    public listNamed(name: string, defaultListGenerator) {
        if (!this.hasNamedList(name)) {
            this.addToNamedList(name, defaultListGenerator());
        }
        return this.getOrCreateNamedList(name);
    }

    public chargeEndOptions() {
        return this.listNamed('chargeEndOptions', () => {
            return [
                {'value': BalanceEndCondition.EndCurrentOff_DetectBalanceOn, 'text': 'Detect Balance Only'},
                {'value': BalanceEndCondition.EndCurrentOn_DetectBalanceOff, 'text': 'End Current Only'},
                {'value': BalanceEndCondition.EndCurrent_or_DetectBalance, 'text': 'Balance or Current'},
                {'value': BalanceEndCondition.EndCurrent_and_DetectBalance, 'text': 'Balance and Current'},
            ];
        });
    }

    public regenerationModeTypeOptions() {
        return this.listNamed(kRegenName, () => [
            {'value': RegenerativeMode.Off, 'text': 'Off'},
            {'value': RegenerativeMode.ToInput, 'text': 'To input'},
            {'value': RegenerativeMode.ToChannel, 'text': 'To channel'}
        ]);
    }

    public regenerationMethodOptions() {
        return this.listNamed(kRegenMthod, () => [
            {'value': RegenerativeToChannelMethod.ResistanceOrBulbs, 'text': 'Resistance / Bulbs'},
            {'value': RegenerativeToChannelMethod.ChargingBattery, 'text': 'Charging battery'},
        ]);
    }

    public safetyTempOptions() {
        return this.listNamed(kSafetyTempOptions, () => {
            let list = [];
            for (let num = 200; num < 800; num += 5) {
                let celcius = (num / 10);
                let farenheight = celciusToF(celcius);
                list.push({
                    'value': celcius,
                    'text': celcius.toString() + System.CELSIUS + ' / ' + farenheight + System.FARENHEIGHT
                });
            }
            return list;
        });
    }

    public safetyCapacityOptions() {
        return this.listNamed(kSafetyCapacity, () => {
            let list = [];
            for (let num = 50; num < 200; num += 5) {
                let capacity = num;
                list.push({'value': capacity, 'text': capacity.toString() + '%'});
            }
            return list;
        });
    }
}

