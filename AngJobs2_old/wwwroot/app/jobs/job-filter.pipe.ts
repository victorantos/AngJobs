import {PipeTransform, Pipe} from "angular2/core";
import {JobPost} from "../core/jobpost"

@Pipe({
    name: 'jobFilter'
})
export /**
 * JobFilter
 */
    class JobFilterPipe implements PipeTransform {

    transform(value: JobPost[], filter: string): JobPost[] {
        if (value == null) {
            return null;
        }
        filter = filter ? filter : null;
        return filter ? value.filter((job: JobPost) =>
            job.jobType.indexOf(filter) !== -1) : value;
    }
}  