import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.page.html',
  styleUrls: ['./maintenance.page.scss'],
})
export class MaintenancePage implements OnInit {

  constructor(
    private router:Router
  ) { }

  ngOnInit() {
  }

  logout(){
    this.router.navigate(['/login']);
    localStorage.clear()
  }

}
