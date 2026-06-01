import { formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { debounceTime, delay, distinctUntilChanged, retry, Subject } from 'rxjs';
import { DeleteDataModalComponent } from 'src/app/components/modal/delete-data-modal/delete-data-modal.component';
import { DataService } from 'src/app/service/data.service';
import { getStatusReportIN, isDarkTheme } from 'src/app/util/utils';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage implements OnInit {
  listReports:any[]=[];

  //Paginate
  visiblePages:number[]=[];
  selectedPage:number=1;
  totalPages:number=0;

  //Entry
  firstIndEntry:number=0;
  lastIndEntry:number=0;
  totalItems:number=0;

  //Search
  searchSubject = new Subject<string>();
  searchQuery: string = '';

  //loadingLoad
  isLoadingLoad = true;

  roleUser : String = localStorage.getItem("role") + ""

  isSearchShow = false;
  constructor(
    private dataService:DataService,
    private modalCtrl:ModalController,
    private navCtrl:NavController
  ) { }

  ngOnInit() {
    (document.getElementById('loader') as HTMLElement).classList.remove('hidden');
    var page = 1;
    if(localStorage.getItem('save_page')){
      page = parseInt(localStorage.getItem('save_page')+"");
      console.log(page);
      localStorage.removeItem('save_page')
    }
    this.setPage(page);

    this.searchSubject.pipe(
      debounceTime(2000),
      distinctUntilChanged()
    ).subscribe((query: string) => {
      this.searchQuery = query;
      this.selectedPage = 1;
      this.getReports();
    });
  }

  ionViewWillEnter(){
    this.getReports();
  }

  onSearch(event: any): void {
    const query = event.target.value;
    this.searchSubject.next(query);
  }

  redirectTo(route:string){
    this.navCtrl.navigateRoot(route);
  }

  getReports(){
    this.isLoadingLoad = true;
    var getReports;
    if(this.roleUser === "technician")
      getReports = this.dataService.getReports(10,this.selectedPage,this.searchQuery,"request")
    else
      getReports = this.dataService.getReports(10,this.selectedPage,this.searchQuery)
    getReports.subscribe(
      (response)=>{
        console.log(response);
        this.listReports = response.data;
        this.totalPages = response.total_page;
        this.totalItems = response.total_items;
        this.selectedPage = parseInt(response.page);
        if(this.listReports.length > 0){
          this.firstIndEntry = response.page * 10 - 9;
          this.lastIndEntry = this.firstIndEntry + this.listReports.length - 1;
        }else{
          this.firstIndEntry = 0;
          this.lastIndEntry = 0;
        }
        this.updatePaginate();
        (document.getElementById('loader') as HTMLElement).classList.add('hidden');
        this.isLoadingLoad = false;
      }
    )
  }

  setPage(page:number){
    if(page == 0)
      return
    if(page > this.totalPages)
      return;
    if(this.selectedPage !== page){
      this.selectedPage = page;
      this.getReports();
    }
  }

  updatePaginate(){
    const maxVisiblePages = 5;
    let startPage: number;
    let endPage: number;

    if (this.totalPages <= maxVisiblePages) {
      startPage = 1;
      endPage = this.totalPages;
    } else {
      if (this.selectedPage <= Math.floor(maxVisiblePages / 2)) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (this.selectedPage + Math.floor(maxVisiblePages / 2) >= this.totalPages) {
        startPage = this.totalPages - maxVisiblePages + 1;
        endPage = this.totalPages;
      } else {
        startPage = this.selectedPage - Math.floor(maxVisiblePages / 2);
        endPage = this.selectedPage + Math.floor(maxVisiblePages / 2);
      }
    }

    this.visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    console.log(this.visiblePages);
  }

  async deleteDataConfirmation(item: any) {
    const dark = isDarkTheme();

    Swal.fire({
      title: 'Konfirmasi Hapus',
      text: 'Apakah kamu yakin ingin menghapus laporan ini?',
      icon: 'warning',
      iconColor: dark ? '#f59e0b' : '#d97706',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      focusCancel: true,

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
    }).then(({ isConfirmed }) => {
      if (!isConfirmed) return;

      this.dataService.deleteReport(item.id).subscribe(() => {
        if (this.selectedPage > 1 && this.listReports.length === 1) {
          this.setPage(this.selectedPage - 1);
        } else {
          localStorage.setItem('save_page', this.selectedPage.toString());
          window.location.reload();
        }
      });
    });
  }

  async setPriorityReport(item: any, status: boolean = true) {
    const dark = isDarkTheme();

    Swal.fire({
      title: status
        ? 'Konfirmasi Prioritaskan'
        : 'Konfirmasi Hapus Prioritas',
      text: status
        ? 'Apakah kamu yakin ingin menjadikan laporan ini prioritas?'
        : 'Apakah kamu yakin ingin menghapus prioritas dari laporan ini?',
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
    }).then(({ isConfirmed }) => {
      if (!isConfirmed) return;

      item.is_priority = status;
      this.dataService.updateReport(item).subscribe(
        () => window.location.reload(),
        (error) => {
          if (error.error && error.error.errors) {
            const errors = error.error.errors;
            console.error(errors);
          }
        }
      );
    });
  }


  limit_length(message:string,length:number):string{
    var value =message.substring(0,length)
    if(message.length > length){
      value += "...";
    }
    return value;
  }

  formatDate(input:string):string{
    return formatDate(input,"dd-MM-yyyy",'en-US')
  }
  formatTime(inputDate: string): string {
    return formatDate(inputDate,'hh:mm','en-US')
  }

  getStatusIN(status:string):string{
    return getStatusReportIN(status)
  }
}
