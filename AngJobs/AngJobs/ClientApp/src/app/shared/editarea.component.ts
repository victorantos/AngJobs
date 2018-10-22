import { Component, Input, forwardRef, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-editarea',
  template: `<section #s (DOMSubtreeModified)="onContentChange($event)" style="height:500px;" class="form-control" contenteditable="true"></section>`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditareaComponent),
      multi: true
    }
  ]
})
export class EditareaComponent implements ControlValueAccessor {
  @ViewChild('s') section;
  onChange;

  onContentChange() {
    this.onChange(this.section.nativeElement.innerHTML);
  }
  writeValue(obj: any): void {
    if (obj !== undefined) {
      this.section.nativeElement.innerHTML = obj;
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
  }
  setDisabledState?(isDisabled: boolean): void {
  }

  constructor() { }
   
}
