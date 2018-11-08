import {Directive, ElementRef, Input, Renderer2} from '@angular/core';

@Directive({selector: '[stepstate]'})
export class StepStateDirective {
    @Input('stepstate')
    set stepstate(value: string) {
        this.renderer.addClass(this.element.nativeElement, value);
    }

    constructor(private renderer: Renderer2, private element: ElementRef) {
    }
}