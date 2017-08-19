import {Pipe, PipeTransform} from "@angular/core";

import {sprintf} from "sprintf-js";
import {celciusToF} from './helpers'
import {NgRedux} from "@angular-redux/store";
import {IAppState} from "../models/state/configure";
import {System} from "../models/system";

@Pipe({name: 'keys'})
export class KeysPipe implements PipeTransform {
    transform(value, args: string[]): any {
        let keys = [];
        for (let key in value) {
            //noinspection JSUnfilteredForInLoop
            keys.push(key);
        }
        return keys;
    }
}

@Pipe({name: 'reverse'})
export class ReversePipe implements PipeTransform {
    transform(value, args: string[]): any {
        return value.slice().reverse();
    }
}

@Pipe({name: 'temp'})
export class TempPipe implements PipeTransform {
    constructor(public  ngRedux: NgRedux<IAppState>) {
    }

    transform(value, args: string[]): any {
        let system: System = this.ngRedux.getState().system.system;
        if (system.isCelsius == false) {
            return celciusToF(value);
        }
        return value;
    }
}

// Shows mm:ss for a duration, assuming starting at zero (in seconds)
@Pipe({name: 'duration'})
export class DurationPipe implements PipeTransform {
    transform(value, args: string[]): any {
        // Expecting seconds
        if (isNaN(value)) {
            return "00:00";
        }
        let minutes = Math.floor(Number(value) / 60);
        let seconds = value % 60;
        return sprintf("%02d:%02d", minutes, seconds);
    }
}

