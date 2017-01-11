import {Directive, OnInit, OnChanges, Optional, Host, SkipSelf, Input} from "@angular/core";
import {ControlContainer, AbstractControl, FormGroup} from "@angular/forms";

@Directive({
    selector: '[formControlName][dynamicDisable]'
})
export class DynamicDisable implements OnInit, OnChanges {
    constructor(@Optional() @Host() @SkipSelf() private parent: ControlContainer,) {

    }


    @Input() formControlName: string;
    // @Input() dynamicDisable: boolean;

    _dynamicDisable: boolean;
    @Input('dynamicDisable')
    set dynamicDisable(value: boolean) {
        this._dynamicDisable = value;
        console.log("thing is now disabled: ", this._dynamicDisable);
    }

    get dynamicDisable(): boolean {
        return this._dynamicDisable;
    }

    private ctrl: AbstractControl;

    ngOnInit() {
        if (this.parent && this.parent["form"]) {
            this.ctrl = (<FormGroup>this.parent["form"]).get(this.formControlName);
        }
    }

    ngOnChanges() {
        if (!this.ctrl) return;

        if (this.dynamicDisable) {
            this.ctrl.disable();
        }
        else {
            this.ctrl.enable();
        }
    }
}