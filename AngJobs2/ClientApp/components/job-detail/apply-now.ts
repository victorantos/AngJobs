import * as ng from "@angular/core";

@ng.Component(
    {
        selector: "apply-now",
        template:  require('./apply-now.html')
        
    })
export class ApplyNow {
    @ng.Input() applied: boolean;
    @ng.Output() appliedChange = new ng.EventEmitter();

   jobapplicationMsg: string;
    applyForJob()
    {
        this.appliedChange.emit(false);
        console.log(this.jobapplicationMsg);
    }
}