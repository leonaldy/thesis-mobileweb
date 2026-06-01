import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-error',
  templateUrl: './error.page.html',
  styleUrls: ['./error.page.scss'],
})
export class ErrorPage implements OnInit {
  code : string | null = "";

  constructor(
    private route:ActivatedRoute,
    private router:Router
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params=>{
      if(!['403','500','404'].includes(params.get('code')+"")){
        this.router.navigate(['error/404']);
      }
    })
    this.code = this.route.snapshot.paramMap.get('code');
    (document.getElementById('loader') as Element).classList.add('hidden');
    (document.querySelector("#navbar") as Element).classList.add('hidden');
  }

}
