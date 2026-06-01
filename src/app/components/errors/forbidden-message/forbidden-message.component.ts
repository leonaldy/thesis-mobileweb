import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forbidden-message',
  templateUrl: './forbidden-message.component.html',
  styleUrls: ['./forbidden-message.component.scss'],
})
export class ForbiddenMessageComponent  implements OnInit {

  constructor(
    private router:Router
  ) { }

  ngOnInit() {}

  backToDashboard(){
    this.router.navigate(['/dashboard']);
  }

}
