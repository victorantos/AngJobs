export class LoggingService{

  public log(message?: any, ...optionalParams: any[]): any {
    return console.log(message, optionalParams);
  }

}
