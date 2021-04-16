import { Component } from "@angular/core";

@Component({
  selector: 'back-button',
  template: "<a class='btn btn-light' href='javascript:void(0);' onclick='javascript:window.history.back(); return false;'><i class='bi bi-chevron-left'></i>  Back</a>",
  styleUrls: []
})
export class BackButtonComponent {

}