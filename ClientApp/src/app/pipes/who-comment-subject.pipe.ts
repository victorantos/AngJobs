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

    let index = index1;
    
    if (index2 > -1)
      index = (index1 < index2) && index1 > -1 ? index1 : index2;
    
    if (index < 0 && index22 > -1)
      index = (index11 < index22) && index11 > -1 ? index11 : index22;

    let t = c.text.slice(0, index).trim();
    if (t.endsWith('|'))
      t = t.slice(0, -1);
    t = t.replace(/&#x2F;/g, '/').replace(/&amp;/g, '&').replace(/&#x27;/g, '\'');
    return t;
  }

}
