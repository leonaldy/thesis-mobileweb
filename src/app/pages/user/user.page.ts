import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { debounceTime, delay, distinctUntilChanged, Subject } from 'rxjs';
import { DeleteDataModalComponent } from 'src/app/components/modal/delete-data-modal/delete-data-modal.component';
import { DataService } from 'src/app/service/data.service';
import { getRoleIN, getStatusUserIN, isDarkTheme, limit_length } from 'src/app/util/utils';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
})
export class UserPage implements OnInit {
  listUsers:any[]=[];

  //Paginate
  visiblePages:number[]=[];
  selectedPage:number=1;
  totalPages:number=0;
  totalItems:number=0;

  //Entry
  firstIndEntry:number=0;
  lastIndEntry:number=0;

  //Search
  searchSubject = new Subject<string>();
  searchQuery: string = '';

  //loadingLoad
  isLoadingLoad = true;

  isSearchShow = false;

  roleUser : String = localStorage.getItem("role") + ""

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
      this.getUsers();
    });
  }

  ionViewWillEnter(){
    this.getUsers();
  }

  onSearch(event: any): void {
    const query = event.target.value;
    this.searchSubject.next(query);
  }

  redirectTo(route:string){
    this.navCtrl.navigateRoot(route);
  }

  getUsers(){
    this.isLoadingLoad = true;

    if(this.roleUser == 'foreman'){
      this.dataService.getForemanTailors(10, this.selectedPage, "",this.searchQuery).subscribe(
        (response) => {
          console.log('Foreman response:', response);
          console.log('Foreman response: ');
          console.log(response);
          this.handleUserResponse(response);
        },
        (error) => {
          console.error('Error fetching foreman tailors:', error);
          this.isLoadingLoad = false;
          (document.getElementById('loader') as HTMLElement).classList.add('hidden');
        }
      );
    } else {
      this.dataService.getUsers(10, this.selectedPage, '', this.searchQuery).subscribe(
        (response) => {
          console.log('Users response:', response);
          this.handleUserResponse(response);
        },
        (error) => {
          console.error('Error fetching users:', error);
          this.isLoadingLoad = false;
          (document.getElementById('loader') as HTMLElement).classList.add('hidden');
        }
      );
    }
  }

  // Method baru untuk handle response yang sama
  private handleUserResponse(response: any) {
    this.listUsers = response.data;
    this.totalPages = response.total_page;
    this.selectedPage = parseInt(response.page);
    this.totalItems = response.total_items;

    if(this.listUsers.length > 0){
      this.firstIndEntry = response.page * 10 - 9;
      this.lastIndEntry = this.firstIndEntry + this.listUsers.length - 1;
    } else {
      this.firstIndEntry = 0;
      this.lastIndEntry = 0;
    }

    this.updatePaginate();
    (document.getElementById('loader') as HTMLElement).classList.add('hidden');
    this.isLoadingLoad = false;
  }

  setPage(page:number){
    if(page == 0)
      return
    if(page > this.totalPages)
      return;
    if(this.selectedPage !== page){
      this.selectedPage = page;
      this.getUsers();
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

    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Apakah Anda yakin ingin menghapus ${item?.name} dengan NIP: ${item?.nik}?`,
      icon: 'warning',
      iconColor: dark ? '#f59e0b' : '#d97706',

      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
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
    });

    if (result.isConfirmed) {
      this.dataService.deleteUser(item.id).subscribe(() => {
        if (this.selectedPage > 1 && this.listUsers.length === 1) {
          this.setPage(this.selectedPage - 1);
        } else {
          localStorage.setItem('save_page', this.selectedPage.toString());
          window.location.reload();
        }
      });
    }
  }


  limit_length(message:string,length:number):string{
    return limit_length(message,length);
  }

  getStatusIN(status:string):string{
    return getStatusUserIN(status);
  }

  getRoleIN(role:string):string{
    return getRoleIN(role);
  }
}
