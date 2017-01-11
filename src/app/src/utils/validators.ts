import {ValidatorFn, FormControl, Validators} from "@angular/forms";
import {isPresent} from "ionic-angular/util/util";

export class ChargerValidator {
    static number(prms = {}): ValidatorFn {
        return (control: FormControl): {[key: string]: any} => {
            if (isPresent(Validators.required(control))) {
                return null;
            }

            let val: number = control.value;
            // console.log("value is: ", val, " of type: ", typeof val, " is NAN: ", isNaN(val));

            if (isNaN(val) || /![\d.]/.test(val.toString())) {
                return {"required": true, "message": "Required"};
            } else if (!isNaN(prms['min']) && !isNaN(prms['max'])) {
                return val < prms['min'] || val > prms['max'] ? {"message": "Must be between " + prms['min'] + " and " + prms['max']} : null;
            } else if (!isNaN(prms['min'])) {
                return val < prms['min'] ? {"message": "Must be > " + prms['min']} : null;
            } else if (!isNaN(prms['max'])) {
                return val > prms['max'] ? {"message": "Must be > " + prms['max']} : null;
            } else {
                return null;
            }
        };
    }
}
