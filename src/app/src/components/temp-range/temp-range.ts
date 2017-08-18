import {Component, EventEmitter, Input, Output} from '@angular/core';


@Component({
    selector: 'temp-range',
    templateUrl: 'temp-range.html'
})
export class TempRangeComponent {
    @Input() label: string = "Something Intelligent Here";
    @Input() metric: boolean = true;
    @Input() pin: boolean = true;
    @Input() value: number = 0;
    @Input() min: number = 0;
    @Input() max: number = 10;

    @Output() valueChange: EventEmitter<any> = new EventEmitter();

    constructor() {
    }

    celciusToF(c): number {
        return c * 9 / 5 + 32;
    }

    displayableValue(celcius: number): number {
        return this.metric ? celcius : this.celciusToF(celcius);
    }

    get min_val(): number {
        return this.displayableValue(this.min);
    }

    get max_val(): number {
        return this.displayableValue(this.max);
    }

    get unitsOfMeasure(): string {
        if (this.metric) {
            return "°C";
        }
        return "°F";
    }

}
