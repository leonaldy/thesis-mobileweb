import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/service/data.service';
import { getProfileImage, getRoleIN, getStatusMachineIN, isDarkTheme } from 'src/app/util/utils';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  constructor(
    private dataService:DataService
  ) { }

  //Field
  id:string=localStorage.getItem('id')+"";
  username:string=localStorage.getItem('username') + "";
  name:string=localStorage.getItem('name') + "";
  email:string=localStorage.getItem('email') == "null" ? "-" : localStorage.getItem('email') + " ";
  nik:string=localStorage.getItem('nik') + "";
  phone_number:string=localStorage.getItem('phone_number') + "";
  role:string=localStorage.getItem('role') + "";

  foreman: any = null;

  //Field
  nim:string="";
  machine_merk:string="";
  machine_type:string="";
  report_id:string="";
  status:string="";
  function:string="";

  ngOnInit() {
    this.getDataProfile()
  }

  ionViewWillEnter(){
    this.getDataProfile()
  }

  getDataProfile(){
    this.dataService.getUser(parseInt(this.id)).subscribe((response)=>{
      console.log(response.data)
      const data = response.data
      this.foreman = response.data.foreman;
      if (data.machine) {
        this.nim = data.machine.nim;
        this.machine_merk = data.machine.machine_merk;
        this.machine_type = data.machine.machine_type;
        this.function = data.machine.function;
        this.status = data.machine.status;

        // Keep localStorage in sync so tailor flows have machine_id even after refresh/login differences
        localStorage.setItem('machine_id', String(data.machine.id));

        if (data.machine.last_pending_report) {
          this.report_id = data.machine.last_pending_report.id;
        }
      } else {
        localStorage.removeItem('machine_id');
      }
    })
  }

  getProfileImage(role: string): string {
    return getProfileImage(role)
  }

  cancelReport() {
    const dark = isDarkTheme();

    Swal.fire({
      title: 'Cancel Report?',
      text: 'Are you sure you want to cancel this repair request?',
      icon: 'warning',
      iconColor: dark ? '#f59e0b' : '#d97706',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No, keep it',
      reverseButtons: true,

      background: dark ? '#1e293b' : '#ffffff',
      color: dark ? '#f1f5f9' : '#0f172a',

      buttonsStyling: false,
      customClass: {
        actions: 'mt-4 flex gap-2',
        confirmButton: `${dark
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-red-600 hover:bg-red-700 text-white'} px-4 py-2 rounded-lg font-medium`,
        cancelButton: `${dark
          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          : 'bg-slate-200 hover:bg-slate-300 text-slate-900'} px-4 py-2 rounded-lg font-medium`,
        popup: 'rounded-xl shadow-lg'
      }
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.dataService.cancelReport(parseInt(this.report_id)).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Cancelled!',
            text: 'The repair request has been cancelled.',
            timer: 1600,
            showConfirmButton: false,
            background: dark ? '#1e293b' : '#ffffff',
            color: dark ? '#f1f5f9' : '#0f172a'
          });
          this.getDataProfile();
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Something went wrong while cancelling.',
            background: dark ? '#1e293b' : '#ffffff',
            color: dark ? '#f1f5f9' : '#0f172a',
            buttonsStyling: false,
            customClass: {
              confirmButton: `${dark
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'} px-4 py-2 rounded-lg font-medium`,
              popup: 'rounded-xl shadow-lg'
            }
          });
        }
      });
    });
  }

  getStatusIN(status: string): string {
    return getStatusMachineIN(status)
  }

  getRoleIN(role:string):string{
    return getRoleIN(role);
  }
}
