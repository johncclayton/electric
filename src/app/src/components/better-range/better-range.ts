import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
    selector: 'better-range',
    templateUrl: 'better-range.html',
})
export class BetterRangeComponent {
    @Input() disabled: boolean = false;
    @Input() pin: boolean = false;
    @Input() multiplier: number = 1;
    @Input() min: number = 0;
    @Input() max: number = 10;

    @Input() left_label: string = null;
    @Input() right_label: string = null;

    @Input() value: number = 0.0;
    @Output() valueChange: EventEmitter<any> = new EventEmitter();

    constructor() {
    }

    get displayableValue(): number {
        return this.value * this.multiplier;
    }

    set displayableValue(val) {
        this.valueChange.emit(val / this.multiplier);
    }
}
