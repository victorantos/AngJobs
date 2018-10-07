export class Job {
  public title: string;
  public description: string;
  public imagePath: string;

  constructor(title: string, description: string, imagePath: string) {
    this.title = title;
    this.description = description;
    this.imagePath = imagePath;
  }
}
