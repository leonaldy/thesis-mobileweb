import { Component, Input, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { DataService } from 'src/app/service/data.service';
import { getStatusMachineIN, limit_length } from 'src/app/util/utils';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent implements OnInit {
  @Input() id: number | undefined;

  listMachines: any[] = [];
  listForeman: any[] = [];

  //Field
  username: string = "";
  name: string = "";
  email: string = "";
  phone_number: string = "";
  role: string = "";
  password: string = "";
  currentForeman: any = null;
  nik: string = "";

  selectedForemanId: number = -1;

  //Machine Field
  machine_type: string = "";
  nim: string = "";
  status: string = "";
  function: string = "";
  machine_merk: string = "";

  //Paginate
  visiblePages: number[] = [];
  selectedPage: number = 1;
  totalPages: number = 0;

  //Foreman Pagination
  visibleForemanPages: number[] = [];
  selectedForemanPage: number = 1;
  totalForemanPages: number = 0;
  totalForemen: number = 0;

  //errorMessage
  error_message: string = "";

  //method
  method: string = "insert";

  //Search
  searchSubject = new Subject<string>();
  searchQuery: string = '';
  isSearchShow = false;

  //Foreman Search
  foremanSearchSubject = new Subject<string>();
  foremanSearchQuery: string = '';

  //loadingLoad
  isLoadingLoad = true;
  isLoadingForeman = false;

  roleUser: String = localStorage.getItem("role") + ""

  currentSelectedRole: string = "";


  constructor(
    private navController: NavController,
    private dataService: DataService
  ) { }

  ngOnInit() {
    (document.getElementById('loader') as HTMLElement).classList.add('hidden');
    if (!Number.isNaN(this.id)) {
      var page = 1;
      this.setPage(page);

      // Machine search setup
      this.searchSubject.pipe(
        debounceTime(2000),
        distinctUntilChanged()
      ).subscribe((query: string) => {
        this.searchQuery = query;
        this.selectedPage = 1;
        this.getMachines();
      });

      // Foreman search setup
      this.foremanSearchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe((query: string) => {
        this.foremanSearchQuery = query;
        this.selectedForemanPage = 1;
        this.getForeman();
      });

      this.getMachines();
      this.getDetailUser();
      this.getForeman();
    }
  }

  onSearch(event: any): void {
    const query = event.target.value;
    this.searchSubject.next(query);
  }

  onSearchForeman(event: any): void {
    const query = event.target.value;
    this.foremanSearchSubject.next(query);
  }

  setPage(page: number) {
    if (page < 1 || page > this.totalPages) return;

    if (this.selectedPage !== page) {
      this.selectedPage = page;
      this.getMachines();
    }
  }

  setForemanPage(page: number) {
    if (page > this.totalForemanPages || page < 1)
      return;
    if (this.selectedForemanPage !== page) {
      this.selectedForemanPage = page;
      this.getForeman();
    }
  }

  updateForemanPagination() {
    const itemsPerPage = 10;
    this.totalForemanPages = Math.ceil(this.totalForemen / itemsPerPage);

    const maxVisiblePages = 5;
    let startPage: number;
    let endPage: number;

    if (this.totalForemanPages <= maxVisiblePages) {
      startPage = 1;
      endPage = this.totalForemanPages;
    } else {
      if (this.selectedForemanPage <= Math.floor(maxVisiblePages / 2)) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (this.selectedForemanPage + Math.floor(maxVisiblePages / 2) >= this.totalForemanPages) {
        startPage = this.totalForemanPages - maxVisiblePages + 1;
        endPage = this.totalForemanPages;
      } else {
        startPage = this.selectedForemanPage - Math.floor(maxVisiblePages / 2);
        endPage = this.selectedForemanPage + Math.floor(maxVisiblePages / 2);
      }
    }

    this.visibleForemanPages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    // Apply pagination to filtered results
    const startIndex = (this.selectedForemanPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
  }

  getMachines() {
    this.isLoadingLoad = true;
    this.dataService.getUserMachines(10, this.selectedPage, this.searchQuery).subscribe(
      (response) => {
        console.log("Machine:");
        console.log(response);
        this.listMachines = response.data;
        this.totalPages = response.total_page;
        this.selectedPage = parseInt(response.page);
        this.updatePaginate();
        (document.getElementById('loader') as HTMLElement).classList.add('hidden');
        this.isLoadingLoad = false;
      }
    )
  }

  updatePaginate() {
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

  haveId(): boolean {
    return !Number.isNaN(this.id)
  }

  getForeman() {
    this.isLoadingForeman = true;
    this.dataService.getUsers(20, 1, 'foreman', this.foremanSearchQuery).subscribe(
      (response) => {
        console.log('Foreman response:', response);
        this.listForeman = response.data.map((foreman: any) => ({
          ...foreman,
          status: foreman.status || 'available'
        }));
        console.log("Data Foreman:")
        console.log(response.data)
        this.isLoadingForeman = false;
      },
      (error) => {
        console.error('Error loading foremen:', error);
        this.isLoadingForeman = false;
      }
    )
  }

  getDetailUser() {
    this.nim = "";
    this.machine_type = "";
    this.status = "";
    this.function = "";
    this.machine_merk = "";
    (document.getElementById('loader') as HTMLElement).classList.remove('hidden');
    this.dataService.getUser(parseInt(this.id + "")).subscribe((response) => {
      (document.getElementById('loader') as HTMLElement).classList.add('hidden');
      this.username = response.data.username;
      this.name = response.data.name;
      this.email = response.data.email;
      this.phone_number = response.data.phone_number;
      this.role = response.data.role;
      this.currentSelectedRole = response.data.role;
      this.currentForeman = response.data.foreman;
      this.method = "update";
      this.nik = response.data.nik;

      if (response.data.machine != null) {
        this.nim = response.data.machine.nim;
        this.machine_type = response.data.machine.machine_type;
        this.status = response.data.machine.status;
        this.function = response.data.machine.function;
        this.machine_merk = response.data.machine.machine_merk;
      }

      console.log(response.data)
    })
  }

  selectForeman(foreman: any) {
    // Prevent selection if foreman is busy or if a foreman is already assigned
    if (foreman.status === 'busy' || this.currentForeman) {
      return;
    }

    const data = {
      id: this.id,
      foreman_id: foreman.id
    };

    this.isLoadingForeman = true;
    this.dataService.updateUser(data).subscribe(
      (response) => {
        if (response.status) {
          this.currentForeman = foreman;
          this.getDetailUser();
          this.getForeman();
        }
        this.isLoadingForeman = false;
      },
      (error) => {
        console.error('Error assigning foreman:', error);
        this.error_message = 'Failed to assign foreman. Please try again.';
        this.isLoadingForeman = false;
      }
    );
  }

  removeForeman() {
    if (!this.currentForeman) return;

    this.isLoadingForeman = true;
    const data: any = {
      id: this.id,
      foreman_id : null
    }
    this.dataService.updateUser(data).subscribe(
      (response) => {
        this.currentForeman = null;
        this.getDetailUser();
        this.getForeman();
        this.isLoadingForeman = false;
      },
      (error) => {
        console.error('Error removing foreman:', error);
        this.error_message = 'Failed to remove foreman. Please try again.';
        this.isLoadingForeman = false;
      }
    );
  }

  backBtn() {
    this.navController.back({ animated: false });
  }

  allowOnlyDigits(event: KeyboardEvent): void {
    const charCode = event.key.charCodeAt(0);
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  save() {
    (document.getElementById('progress-save') as Element).classList.remove('hidden');
    (document.getElementById('button-group-save') as Element).classList.add('hidden');
    const data: any = {
      username: this.username,
      name: this.name,
      email: this.email,
      phone_number: this.phone_number,
      role: this.role,
      nik: this.nik
    };

    if (this.password != "") {
      data.password = this.password
    }

    if (this.method != "update") {
      this.insertData(data)
    } else {
      this.updateData(data);
    }
    console.log(data);
  }

  insertData(data: any) {
    this.dataService.insertUser(data).subscribe((response) => {
      this.backBtn();
    },
      (error) => {
        if (error.error && error.error.errors) {
          const errors = error.error.errors;

          for (const field in errors) {
            if (errors[field].length > 0) {
              this.error_message = errors[field][0];
              break;
            }
          }
        }
        (document.getElementById('progress-save') as Element).classList.add('hidden');
        (document.getElementById('button-group-save') as Element).classList.remove('hidden');
      });
  }

  updateData(data: any) {
    data.id = this.id;
    this.dataService.updateUser(data).subscribe((response) => {
      this.backBtn();
    },
      (error) => {
        if (error.error && error.error.errors) {
          const errors = error.error.errors;

          for (const field in errors) {
            if (errors[field].length > 0) {
              this.error_message = errors[field][0];
              break;
            }
          }
        }
        (document.getElementById('progress-save') as Element).classList.add('hidden');
        (document.getElementById('button-group-save') as Element).classList.remove('hidden');
      });
  }

  hiddenFor(roles: string[]): boolean {
    localStorage.getItem("role");
    return roles.some(role => role === localStorage.getItem("role"));
  }

  limit_length(message: string | null, length: number): string {
    if(!message)
      return "-"
    return limit_length(message, length);
  }

  removeMachine() {
    this.dataService.removeUserMachine(this.id ? this.id : 0).subscribe((response) => {
      this.getDetailUser();
      this.getMachines();
    });
  }

  setMachine(idMachine: number) {
    const data = {
      user_id: this.id,
      machine_id: idMachine
    }
    this.dataService.addUserMachine(data).subscribe((response) => {
      if (response.status) {
        this.getDetailUser();
        this.getMachines();
      }
    });
  }

  showForm(roleItem: string): boolean {
    const roles = ["tailor"];
    return roles.some(role => role === roleItem);
  }

  getStatusIN(status:string):string{
    return getStatusMachineIN(status)
  }
}
