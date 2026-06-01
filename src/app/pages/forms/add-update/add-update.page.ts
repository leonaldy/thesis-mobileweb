import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-update',
  templateUrl: './add-update.page.html',
  styleUrls: ['./add-update.page.scss'],
})
export class AddUpdatePage implements OnInit {
  table:string|null="";
  id:number=0;

  constructor(
    private route:ActivatedRoute
  ) { }

  ngOnInit() {
    this.table = this.route.snapshot.paramMap.get('table');
    this.id = parseInt(this.route.snapshot.paramMap.get('id')+"");
  }
}
