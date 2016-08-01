import {Injectable} from 'angular2/core';
import {JobPost} from './jobpost';

@Injectable()
export class SharedService{
    selectedJobdetail: JobPost = null;
    
    
    constructor()
    {
        console.log("vSharedService constr is called");
    }
    saveSelectedJob(job: JobPost){
        
        this.selectedJobdetail = job;
    }
    
    getSelectedJob(): JobPost{
        return this.selectedJobdetail;
    }
}