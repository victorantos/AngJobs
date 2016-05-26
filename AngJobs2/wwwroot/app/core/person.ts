export class Person {
    public id: number;
    public first: string;
    public last: string;
    public age: number;
    public favoriteBeerz: string;

    public get Name(): string {
        return this.first + ' ' + this.last;
    }
}