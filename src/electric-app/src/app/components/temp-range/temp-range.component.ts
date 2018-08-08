import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import * as _ from 'lodash';
import {System} from '../../models/system';

@Component({
    selector: 'temp-range',
    templateUrl: './temp-range.component.html',
    styleUrls: ['./temp-range.component.scss']
})
export class TempRangeComponent implements OnInit {

    constructor() {
    }

    ngOnInit() {
    }

    @Input() label: string = 'Something Intelligent Here';
    @Input() metric: boolean = true;
    @Input() disabled: boolean = false;
    @Input() pin: boolean = true;
    @Input() value: number = 0; // this is ALWAYS in Celsius
    @Input() min: number = 0;
    @Input() max: number = 10;

    @Output() valueChange: EventEmitter<any> = new EventEmitter();

    get displayableValue(): number {
        return this.toDisplayValue(this.value);
    }

    set displayableValue(value: number) {
        if (this.metric) {
            this.value = _.clamp(value, this.min, this.max);
        } else {
            this.value = _.clamp(this.farenheightToC(value), this.min, this.max);
        }
        this.value = Math.round(this.value);
    }

    emitChangedCelsiusValue(event) {
        this.displayableValue = event.value;
        // We ALWAYS emit celsius values.
        // event.value = this.value;
        this.valueChange.emit(this.value);
    }

    // noinspection JSMethodCanBeStatic
    celciusToF(c): number {
        return c * 9 / 5 + 32;
    }

    // noinspection JSMethodCanBeStatic
    farenheightToC(f): number {
        return (f - 32) / (9 / 5);
    }

    toDisplayValue(celcius: number): number {
        return this.metric ? celcius : this.celciusToF(celcius);
    }

    get min_val(): number {
        return this.toDisplayValue(this.min);
    }

    get max_val(): number {
        return this.toDisplayValue(this.max);
    }

    get unitsOfMeasure(): string {
        return System.unitsOfMeasure(this.metric);
    }

}
