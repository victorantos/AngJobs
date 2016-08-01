import { Component, EventEmitter, Output } from 'angular2/core';

@Component({
    selector: 'job-apply',
    templateUrl: 'app/jobs/job-apply.component.html',
    styleUrls: ['app/jobs/job-apply.component.css'],
    directives: []
})
export /**
 * JobApply
 */
    class JobApplyComponent {
    @Output() discardApplication = new EventEmitter<boolean>();

    @Output() appliedForJob = new EventEmitter<boolean>();

    constructor() {

    }

    dontSubmit(event,el): boolean {
        console.log('keypressed', event);
        if (event.keyCode == 13) {
            el.focus(); //focus on the msg textarea
            return false;
        }
        return true;
    }
    
    onSubmit() {
        console.log('form submit');
    }

    sendJobApplication() {

        this.appliedForJob.emit(false);
    }
    discardMsg() {
        this.discardApplication.emit(false);
    }
}