import { Http, Response } from "@angular/http";
import { Observable } from 'rxjs/Observable';
import { FlickrPhoto } from "../model/FlickrPhoto";
import { Injectable } from "@angular/core";

@Injectable()
export class SharedService {
    constructor(private http: Http) {
    }

    public ApplyForJob(data: any): Observable<any>
    {
        let url = "/api/Jobs"
        return this.http.post(url, data)
            .catch((error: any) => Observable.throw(error.json().error || 'Server error'));
    }

    public GetRandomOfficeImage(): Observable<FlickrPhoto> {
        let imgUrl = null;
        let itemsPerPage = 30;
        let officeImgs = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=ca370d51a054836007519a00ff4ce59e&text=office+space+desk&extras=url_m"
            + "&per_page=" + itemsPerPage
            + "&format=json&nojsoncallback=1";

        return this.http.get(officeImgs)
            .map((result: Response) =>
                result.json().photos.photo[getRandomInt(0, itemsPerPage-1)]
            )
            .catch((error: any) => Observable.throw(error.json().error || 'Server error'));

        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min;
        }
    }
}

//"id":"34131307901","owner":"148230778@N03","secret":"320f16930a","server":"4164","farm":5,"title":"Where I Work: Aaron Edwards of The Charles","ispublic":1,"isfriend":0,"isfamily":0,"url_m":"https:\/\/farm5.staticflickr.com\/4164\/34131307901_320f16930a.jpg","height_m":"333","width_m":"500"},{"id":"34100307482","owner":"131757585@N03","secret":"b4f05a5506","server":"2820","farm":3,"title":"Do You Know Where To Buy Crystal Desk Accessories?","ispublic":1,"isfriend":0,"isfamily":0,"url_m":"https:\/\/farm3.staticflickr.com\/2820\/34100307482_b4f05a5506.jpg","height_m":"145","width_m":"500"},{"id":"33369794563","owner":"143985132@N05","secret":"fdb2363294","server":"2883","farm":3,"title":"Man holds digital tablet computer in his hands","ispublic":1,"isfriend":0,"isfamily":0,"url_m":"https:\/\/farm3.staticflickr.com\/2883\/33369794563_fdb2363294.jpg","height_m":"333","width_m":"500"},{"id":"33312521474","owner":"143203614@N07","secret":"92744bb996","server":"2840","farm":3,"title":"Best Office desks for small spaces","ispublic":1,"isfriend":0,"isfamily":0,"url_m":"https:\/\/farm3.staticflickr.com\/2840\/33312521474_92744bb996.jpg","height_m":"262","width_m":"500"