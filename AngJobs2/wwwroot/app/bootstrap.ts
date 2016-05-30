///<reference path="../../node_modules/angular2/typings/browser.d.ts"/>
import {bootstrap} from 'angular2/platform/browser';
import { App } from './app';
import { SharedService } from './core/shared.service';

bootstrap(App, [SharedService] ) 
  .then(success => console.log(`Bootstrap success .`))
  .catch(error => console.log(error));   
  