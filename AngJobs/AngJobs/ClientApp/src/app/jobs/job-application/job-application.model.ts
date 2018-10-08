import { Job } from "../job.model";

export class JobApplication {
  public id: number;

  constructor(
    public job: Job,
    public fromEmail: string,
    public message: string) {

  }
}
