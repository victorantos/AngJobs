export class Job {
  public title: string;
  public description: string;
  public imagePath: string;
  public location: string;

  constructor(title: string, description: string, imagePath: string, location: string) {
    this.title = title;
    this.description = description;
    this.imagePath = imagePath;
    this.location = location;
  }
}
