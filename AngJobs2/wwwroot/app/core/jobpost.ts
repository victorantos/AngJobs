export class JobPost {
    public id: number;
    public title: string;

    public get shortTitle(): string {
        return this.title;
    }
}