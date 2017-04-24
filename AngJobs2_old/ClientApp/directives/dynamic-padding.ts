import { Directive, ElementRef, Input, OnChanges, SimpleChanges  } from '@angular/core';

@Directive({ selector: '[dynamicPadding]' })
export class DynamicPaddingDirective implements OnChanges {
    @Input('dynamicPadding') topPadding: number;

    el: ElementRef;

    constructor(el: ElementRef) {
        this.el = el;
    }
    ngOnChanges(changes: SimpleChanges) {
        this.el.nativeElement.style.paddingTop = this.calculateTopPadding(this.el.nativeElement.offsetHeight) + "px";
    }

    calculateTopPadding(height: number) {
        let padding = (this.topPadding ? this.topPadding : 0);
        height = height || 0;

        //remove the height
        if (padding > 0)
            padding = padding - height;

        console.log("height:" + height);
        return padding;
    }
}