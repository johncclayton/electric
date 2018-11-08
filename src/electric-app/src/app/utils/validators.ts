import {AbstractControl, FormControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn} from '@angular/forms';
import {Directive, Input} from '@angular/core';

@Directive({
    selector: '[minMaxValues]',
    providers: [{provide: NG_VALIDATORS, useExisting: ChargerValidator, multi: true}]
})
export class ChargerValidator implements Validator {
    @Input('minMaxValues') params: string;

    static number(prms = {}): ValidatorFn {
        return (control: FormControl): { [key: string]: any } => {
            // if (isPresent(Validators.required(control))) {
            //     return null;
            // }

            let val: number = control.value;
            // console.log("value is: ", val, " of type: ", typeof val, " is NAN: ", isNaN(val));
            return ChargerValidator.doValidation(val, prms['min'], prms['max']);
        };
    }

    registerOnValidatorChange(fn: () => void): void {
    }

    static doValidation(val: any, min = Number.NaN, max = Number.NaN) {
        // console.log(`value is: ${val} of type: ${typeof val}, is NAN: ${isNaN(val)}`);

        // if (isNaN(val) || val === null || /![\d.]/.test(val.toString())) {
        //     return {'required': true, 'message': 'Required'};
        // } else if (!isNaN(min) && !isNaN(max)) {

        if (!isNaN(min) && !isNaN(max)) {
            return val < min || val > max ? {'message': 'Must be between ' + min + ' and ' + max} : null;
        } else if (!isNaN(min)) {
            return val < min ? {'message': 'Must be > ' + min} : null;
        } else if (!isNaN(max)) {
            return val > max ? {'message': 'Must be > ' + max} : null;
        } else {
            return null;
        }
    }

    validate(control: AbstractControl): ValidationErrors | null {

        let minValue = Number.NaN;
        let maxValue = Number.NaN;
        let parts = this.params.split(',');
        if (parts.length > 0) {
            // min first
            minValue = Number(parts[0]);
            if (parts.length > 1) {
                // max value
                maxValue = Number(parts[1]);
            }
        }

        let result = ChargerValidator.doValidation(control.value, minValue, maxValue);
        // console.log(`ChargerValidator called with : ${control.value}. Params: ${this.params}. Min: ${minValue}, Max: ${maxValue}. Result: ${result}`);
        return result;
    }
}
