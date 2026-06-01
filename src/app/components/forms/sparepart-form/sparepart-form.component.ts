import { Component, Input, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DataService } from 'src/app/service/data.service';
import { extractErrorMessage } from 'src/app/util/utils';
@Component({
  selector: 'app-sparepart-form',
  templateUrl: './sparepart-form.component.html',
  styleUrls: ['./sparepart-form.component.scss'],
})
export class SparepartFormComponent  implements OnInit {
@Input() id:number | undefined;

  //Field
  sparepart_name:string="";
  qty:string="";

  //errorMessage
  error_message:string="";

  //method
  method:string="insert";

  constructor(
    private navController:NavController,
    private dataService:DataService
  ) { }

  ngOnInit() {
    (document.getElementById('loader') as HTMLElement).classList.add('hidden');
    if(!Number.isNaN(this.id))
      this.getDetailMachine();
  }

  getDetailMachine(){
    (document.getElementById('loader') as HTMLElement).classList.remove('hidden');
    this.dataService.getSparepart(parseInt(this.id+"")).subscribe((response)=>{
      (document.getElementById('loader') as HTMLElement).classList.add('hidden');
      this.sparepart_name = response.data.sparepart_name;
      this.qty = response.data.qty;
      this.method = "update";
    })
  }

  backBtn(){
    this.navController.back({ animated: false });
  }

  save(){
    (document.getElementById('progress-save') as Element).classList.remove('hidden');
    (document.getElementById('button-group-save') as Element).classList.add('hidden');
    const data = {
      sparepart_name:this.sparepart_name,
      qty:this.qty
    }
    if(this.method != "update"){
      this.insertData(data)
    }else{
      this.updateData(data);
    }
  }

  insertData(data:any){
    this.dataService.insertSparepart(data).subscribe((response)=>{
      this.backBtn();
    },
    (error)=>{
      if (error.error) {
        this.error_message = extractErrorMessage(error);
      }
      (document.getElementById('progress-save') as Element).classList.add('hidden');
      (document.getElementById('button-group-save') as Element).classList.remove('hidden');
    });
  }
  updateData(data:any){
    data.id = this.id;
    this.dataService.updateSparepart(data).subscribe((response)=>{
      this.backBtn();
    },
    (error)=>{
      if (error.error) {
        this.error_message = extractErrorMessage(error)
      }
      (document.getElementById('progress-save') as Element).classList.add('hidden');
      (document.getElementById('button-group-save') as Element).classList.remove('hidden');
    });
  }
}
