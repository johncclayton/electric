import {Component, EventEmitter, Input, Output} from '@angular/core';
import {System} from "../../models/system";
import {clamp} from "ionic-angular/util/util";


@Component({
    selector: 'temp-range',
    templateUrl: 'temp-range.html'
})
export class TempRangeComponent {
    @Input() label: string = "Something Intelligent Here";
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
            this.value = clamp(this.min, value, this.max);
        } else {
            this.value = clamp(this.min, this.farenheightToC(value), this.max);
        }
        this.value = Math.round(this.value);
    }

    emitChangedCelsiusValue(event) {
        this.displayableValue = event.value;
        // We ALWAYS emit celsius values.
        // event.value = this.value;
        this.valueChange.emit(this.value);
    }

    constructor() {
    }

    celciusToF(c): number {
        return c * 9 / 5 + 32;
    }

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
