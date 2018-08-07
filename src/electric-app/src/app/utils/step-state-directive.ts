import {Directive, ElementRef, Input, Renderer2} from '@angular/core';

@Directive({selector: '[elecstepstate]'})
export class StepStateDirective {
    @Input('stepState')
    set stepState(value: string) {
        this.renderer.addClass(this.element.nativeElement, value);
    }

    constructor(private renderer: Renderer2, private element: ElementRef) {
    }
}