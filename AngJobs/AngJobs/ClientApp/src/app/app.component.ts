import { Component } from '@angular/core';
import { LoggingService } from './services/logging.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']

})
export class AppComponent {
  title = 'app';
  loadedFeature: string = "job";

  constructor(private logging: LoggingService) { }

  onNavigate(feature: string) {
    this.loadedFeature = feature;
    this.logging.log('a new featured has been loaded:', feature);
  }
}
