import { PipeTransform, Pipe } from "@angular/core";

@Pipe(
  {
    name: 'striphtml'
  }
)
export class StripHtmlPipe implements PipeTransform {
  transform(value: any) {
    return this.strip(value);
  }

  strip(html) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }
}
