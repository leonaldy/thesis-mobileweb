import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { NavController } from '@ionic/angular';
import { forkJoin } from 'rxjs';
import { DataService } from 'src/app/service/data.service';
import { isDarkTheme } from 'src/app/util/utils';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-report-form',
  templateUrl: './report-form.component.html',
  styleUrls: ['./report-form.component.scss'],
})
export class ReportFormComponent  implements OnInit {
  @Input() id:number | undefined;

  //Field
  nik:string="";
  name:string="";
  nim:string="";
  title:string="";
  description:string="";
  notes:string="";
  status:string="request";
  action_report:any=null;
  is_priority:boolean=false;

  //errorMessage
  error_message:string="";

  //method
  method:string="insert";

  //user and machine
  user_id:number|null=null;
  machine_id:number|null=null;
  category_id:number=0;

  isTailor: boolean = false;
  categories: any[] = [];
  role: string = localStorage.getItem("role") ?? "";
  login_user_id: string = localStorage.getItem("id") ?? "";


  constructor(
    private navController:NavController,
    private dataService:DataService,
    private router:Router
  ) { }

  ngOnInit() {
    if(localStorage.getItem('role') == 'tailor'){
      const get_machine_id = localStorage.getItem('machine_id');
      if(get_machine_id ){
        this.machine_id = parseInt(get_machine_id)
        this.user_id = parseInt(localStorage.getItem('id') + "")
        this.status = "request"
        this.isTailor = true
      }else{
        this.router.navigate(['/error/404'],{replaceUrl : true});
      }
    }
    this.getCategories();
    (document.getElementById('loader') as HTMLElement).classList.add('hidden');
    if(!Number.isNaN(this.id))
      this.getDetailReport();
  }

  getCategories(){
    (document.getElementById('loader') as HTMLElement).classList.remove('hidden');
    this.dataService.getCategories(10,1,"").subscribe((response)=>{
      (document.getElementById('loader') as HTMLElement).classList.add('hidden');
      this.categories = response.data
    })
  }


  getDetailReport(){
    (document.getElementById('loader') as HTMLElement).classList.remove('hidden');
    this.dataService.getReport(parseInt(this.id + "")).subscribe((response) => {
      console.log(response);
      (document.getElementById('loader') as HTMLElement).classList.add('hidden');

      // Role access control
      const user = response.data.user;
      if (this.role === 'foreman' && user.foreman_id !== parseInt(this.login_user_id)) {
        window.history.back();
        return;
      }

      if (this.role === 'tailor' && user.id !== parseInt(this.login_user_id)) {
        // Swal.fire({
        //   icon: 'error',
        //   title: 'Access Denied',
        //   text: 'You are not authorized to view this report.',
        // }).then(() => {
        //   window.history.back();
        // });
        window.history.back();
        return;
      }

      if ((this.role === 'tailor' || this.role === 'foreman') && response.data.status === "done") {
        window.history.back();
        return;
      }

      this.nim = response.data.machine.nim;
      this.nik = user.nik;
      this.name = user.name;
      this.title = response.data.title;
      this.description = response.data.category?.description ?? "";
      this.notes = response.data.notes;
      this.category_id = response.data.category_id;
      this.status = response.data.status;
      this.is_priority = response.data.is_priority;
      this.action_report = response.data.action_report;
      this.method = "update";
    });
  }

  backBtn(){
    this.navController.back({ animated: false });
  }

  save() {
    // Tampilkan indikator loading
    (document.getElementById('progress-save') as Element).classList.remove('hidden');
    (document.getElementById('button-group-save') as Element).classList.add('hidden');
    console.log("Check method: " + this.method);

    // Data umum
    const baseData: any = {
      title: this.title,
      notes: this.notes,
      machine_id: this.machine_id,
      user_id: this.user_id,
      status: this.status,
      type: 0,
    };

    if (!this.isTailor) {
      forkJoin({
        machine: this.dataService.getMachines(1, 1, this.nim),
        user: this.dataService.getUsers(1, 1, "", this.nik)
      }).subscribe(({ machine, user }) => {
        const machineData = machine.data[0];
        this.machine_id = machineData?.nim === this.nim ? machineData.id : 0;

        const userData = user.data[0];
        this.user_id = userData?.nik === this.nik ? userData.id : 0;

        const data = {
          ...baseData,
          machine_id: this.machine_id,
          user_id: this.user_id,
        };

        if (this.category_id !== 0) {
          data.category_id = this.category_id;
          data.description = this.description;
        }

        if (this.method === "update") {
          this.updateData({ ...data, id: this.id });
        } else {
          this.insertData(data);
        }

      }, (error) => {
        console.error("Error loading data:", error);
        this.machine_id = 0;
        this.user_id = 0;
      });

    } else {
      // Untuk Tailor juga cek apakah insert atau update
      const tailorData: any = { ...baseData };
      if (this.method === "update") {
        tailorData.id = this.id;
        this.updateData(tailorData);
      } else {
        this.insertData(tailorData);
      }
    }
  }



  insertData(data: any) {
    this.dataService.insertReport(data).subscribe({
      next: () => {
        this.backBtn();
      },
      error: (error) => {
        console.error(error);
        const dark = isDarkTheme();

        const allErrors = error?.error?.errors;

        let errorMsg = 'Terjadi kesalahan';
        if (allErrors && typeof allErrors === 'object') {
          // Ambil semua pesan error dan gabungkan
          errorMsg = Object.values(allErrors)
            .flat()
            .filter(Boolean)
            .join('\n');
        } else {
          errorMsg = error?.error?.message || errorMsg;
        }

        Swal.fire({
          icon: 'error',
          title: 'Gagal menyimpan data',
          text: errorMsg,
          background: dark ? '#1e293b' : '#ffffff',
          color: dark ? '#f1f5f9' : '#0f172a',
          confirmButtonColor: dark ? '#ef4444' : '#d33'
        });

        // Tampilkan kembali tombol setelah error
        (document.getElementById('progress-save') as HTMLElement).classList.add('hidden');
        (document.getElementById('button-group-save') as HTMLElement).classList.remove('hidden');
      }
    });
  }


  updateData(data:any){
    data.id = this.id
    this.dataService.updateReport(data).subscribe((response)=>{
      this.backBtn();
    },
    (error)=>{
      if (error.error && error.error.errors) {
        const errors = error.error.errors;

        for (const field in errors) {
          if (errors[field].length > 0) {
            if(field === "user_id" || field === "machine_id")
              this.error_message = "Invalid Value";
            else
              this.error_message = errors[field][0];
            break;
          }
        }
      }
      (document.getElementById('progress-save') as Element).classList.add('hidden');
      (document.getElementById('button-group-save') as Element).classList.remove('hidden');
    });
  }

  cancelReport() {
    const dark = isDarkTheme();

    Swal.fire({
      title: 'Batalkan laporan ini?',
      text: 'Tindakan ini tidak dapat dibatalkan.',
      icon: 'warning',
      iconColor: dark ? '#f59e0b' : '#d97706',
      showCancelButton: true,
      confirmButtonText: 'Ya, batalkan!',
      cancelButtonText: 'Tidak, tetap simpan',
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
      if (result.isConfirmed) {
        this.dataService.cancelReport(this.id ?? -1).subscribe({
          next: () => {
            Swal.fire('Dibatalkan!', 'Laporan telah dibatalkan.', 'success');
            window.history.back();
          },
          error: () => {
            Swal.fire('Gagal', 'Gagal membatalkan laporan.', 'error');
          }
        });
      }
    });
  }

  async setPriority() {
    const dark = isDarkTheme();
    const status = !this.is_priority;

    const konfirmasi = await Swal.fire({
      title: status ? 'Tetapkan Prioritas?' : 'Batalkan Prioritas?',
      text: status
        ? 'Apakah Anda yakin ingin menetapkan laporan ini sebagai prioritas?'
        : 'Hapus prioritas dari laporan ini?',
      icon: 'question',
      iconColor: dark ? '#60a5fa' : '#2563eb',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
      reverseButtons: true,

      background: dark ? '#1e293b' : '#ffffff',
      color: dark ? '#f1f5f9' : '#0f172a',

      buttonsStyling: false,
      customClass: {
        actions: 'mt-4 flex gap-2',
        confirmButton: `${dark
          ? 'bg-blue-500 hover:bg-blue-600 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'} px-4 py-2 rounded-lg font-medium`,
        cancelButton: `${dark
          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          : 'bg-slate-200 hover:bg-slate-300 text-slate-900'} px-4 py-2 rounded-lg font-medium`,
        popup: 'rounded-xl shadow-lg'
      }
    });

    if (!konfirmasi.isConfirmed) return;

    const payload = {
      id: this.id,
      is_priority: status,
    };

    this.dataService.updateReport(payload).subscribe({
      next: () => {
        this.is_priority = status;
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Diperbarui!',
          text: status
            ? 'Laporan telah ditetapkan sebagai prioritas.'
            : 'Prioritas telah dihapus.',
          timer: 1500,
          showConfirmButton: false,
          background: dark ? '#1e293b' : '#ffffff',
          color: dark ? '#f1f5f9' : '#0f172a',
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Gagal memperbarui prioritas.',
          background: dark ? '#1e293b' : '#ffffff',
          color: dark ? '#f1f5f9' : '#0f172a',
        });
      }
    });
  }
}
