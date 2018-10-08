import { Directive, HostListener, OnInit, HostBinding, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appClose]'
})
export class CloseDirective implements OnInit {
  @Output() close: EventEmitter<any> = new EventEmitter();

  @HostBinding('class.hide') isClosed = false;

  @HostListener('click') toggleClose() {
    this.isClosed = !this.isClosed;

    this.close.emit(this.isClosed);
  }
  constructor() { }

  ngOnInit() {

  }
}
