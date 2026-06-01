import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-servererror-message',
  templateUrl: './servererror-message.component.html',
  styleUrls: ['./servererror-message.component.scss'],
})
export class ServererrorMessageComponent  implements OnInit {

  constructor(private location:Location) { }

  ngOnInit() {}

  backToDashboard(){
    this.location.back();
  }
}
