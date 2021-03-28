import { Pipe, PipeTransform } from '@angular/core';
import { WhoPostComment } from '../models/WhoPostComment';

@Pipe({
  name: 'whoCommentSubject'
})
export class WhoCommentSubjectPipe implements PipeTransform {

  transform(c: WhoPostComment): string {
         
    const index1 = c.text.indexOf('<' + 'a');
    const index11 = c.text.indexOf('a' + '>');
    const index2 = c.text.indexOf('<' + 'p');
    const index22 = c.text.indexOf('p' + '>');
    let index = (index1 < index2) && index1 > -1 ? index1 : index2;
    
    if (index < 0)
      index = (index11 < index22) && index11 > -1 ? index11 : index22;
    console.log("found for {0}, indedx {1}", c.id, index);

    let t = c.text.slice(0, index).trim();
    if (t.endsWith('|'))
      t = t.slice(0, -1);
    
    return t;
  }

}
