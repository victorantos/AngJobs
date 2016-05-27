export class JobPost {
    public id: number;
    public title: string;
    public description: string;
    public jobType: string;
    
    public get shortTitle(): string {
        return this.title;
    }
}