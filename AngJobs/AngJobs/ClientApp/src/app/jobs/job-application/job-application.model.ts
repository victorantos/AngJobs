import { Job } from "../job.model";

export class JobApplication {
  public id: number;
  public dateApplied: Date;

  constructor(
    public job: Job,
    public fromEmail: string,
    public message: string) {

    this.dateApplied = new Date();
  }
}
