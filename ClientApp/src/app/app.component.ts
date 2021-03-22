import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { Terminal } from 'xterm';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit  {
  @ViewChild('terminal') terminal: ElementRef;

  title = 'ClientApp';
  term = new Terminal();

  ngAfterViewInit() {
    var self = this;
    this.term.open(this.terminal.nativeElement);
    this.term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ');
    this.term.onKey((e : any) =>{
      self.term.write(e.key);
      console.log(e);
    });
  }
 
   
}
