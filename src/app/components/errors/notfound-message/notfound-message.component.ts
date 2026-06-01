import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-notfound-message',
  templateUrl: './notfound-message.component.html',
  styleUrls: ['./notfound-message.component.scss'],
})
export class NotfoundMessageComponent  implements OnInit {

  constructor(private location:Location) { }

  ngOnInit() {

  }
  backToDashboard(){
    this.location.back();
  }
}
