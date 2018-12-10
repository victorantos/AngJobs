import { Component, OnInit } from '@angular/core';
import { Recommendation } from '../shared/recommendation'
@Component({
  selector: 'app-recommendation-list',
  templateUrl: './recommendation-list.component.html',
  styleUrls: ['./recommendation-list.component.css']
})
export class RecommendationListComponent implements OnInit {
  recommendations: Recommendation[] = [
    new Recommendation('first recomm', 'this is a .NET C# role'),
    new Recommendation('first recomm', 'this is a Angular role'),
    new Recommendation('first recomm', 'this is a React role'),
    new Recommendation('first recomm', 'this is a Sitecore role')
  ];
  constructor() { }

  ngOnInit() {
  }

}
