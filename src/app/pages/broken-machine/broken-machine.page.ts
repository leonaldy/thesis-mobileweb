import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { DataService } from 'src/app/service/data.service';
import { getDifficultyIN, getStatusMachineIN, getStatusReportIN } from 'src/app/util/utils';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-broken-machine',
  templateUrl: './broken-machine.page.html',
  styleUrls: ['./broken-machine.page.scss'],
})
export class BrokenMachinePage implements OnInit, OnDestroy {
  @ViewChild('userScrollContainer', { static: false }) userScrollContainer!: ElementRef;
  @ViewChild('brokenScrollContainer', { static: false }) brokenScrollContainer!: ElementRef;

  listBrokenMachine: any[] = [];
  listUserRunning: any[] = [];

  pageBroken = 1;
  totalPageBroken = 1;
  totalDataBroken = 0;
  hasMoreBroken = true;

  pageUser = 1;
  totalPageUser = 1;
  totalDataUser = 0;
  hasMoreUser = true;

  scrollTimeoutUser: any = null;
  scrollTimeoutBroken: any = null;
  isLoadingBroken: boolean = false;
  isLoadingUser: boolean = false;

  // Flag untuk mencegah multiple request bersamaan
  isRequestingBroken: boolean = false;
  isRequestingUser: boolean = false;

  // Intersection Observer untuk auto-load
  private userObserver?: IntersectionObserver;
  private brokenObserver?: IntersectionObserver;

  constructor(private dataService: DataService, private router:Router) {
    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((event: any) => {
      if (event.urlAfterRedirects === '/broken-machine') {
        this.refreshBrokenMachine();
        this.refreshUserRunning();
      }
    });
  }

  ngOnInit() {
    this.loadInitialData();
    // Setup intersection observer setelah view init
    setTimeout(() => this.setupIntersectionObservers(), 100);
  }

  ngOnDestroy() {
    // Cleanup timeouts
    if (this.scrollTimeoutUser) {
      clearTimeout(this.scrollTimeoutUser);
    }
    if (this.scrollTimeoutBroken) {
      clearTimeout(this.scrollTimeoutBroken);
    }

    // Cleanup observers
    if (this.userObserver) {
      this.userObserver.disconnect();
    }
    if (this.brokenObserver) {
      this.brokenObserver.disconnect();
    }
  }

  setupIntersectionObservers() {
    // Observer untuk user section
    this.userObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.hasMoreUser && !this.isRequestingUser) {
          this.getUserRunning();
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    // Observer untuk broken machine section
    this.brokenObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.hasMoreBroken && !this.isRequestingBroken) {
          this.getBrokenMachine();
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });
  }

  loadInitialData() {
    this.isLoadingBroken = true;
    this.isLoadingUser = true;

    this.getBrokenMachine();
    this.getUserRunning();
  }

  getBrokenMachine(event?: any) {
    // Prevent multiple concurrent requests
    if (this.isRequestingBroken || !this.hasMoreBroken) {
      if (event) event.target.complete();
      return;
    }

    this.isRequestingBroken = true;

    this.dataService.getReportForeman(10, this.pageBroken, "", "").subscribe(
      (res) => {
        if (res.status && res.data && res.data.length > 0) {
          console.log("Response:")
          console.log(res.data)
          const newItems = res.data.filter((newItem: any) =>
            !this.listBrokenMachine.some(existingItem => existingItem.id === newItem.id)
          );

          this.listBrokenMachine = [...this.listBrokenMachine, ...newItems];
          this.totalPageBroken = res.total_page;
          this.totalDataBroken = res.total_items;

          // Check if we have more pages
          this.hasMoreBroken = this.pageBroken < this.totalPageBroken;

          if (this.hasMoreBroken) {
            this.pageBroken++;
          }

          // Auto-load jika container masih belum scrollable dan masih ada data
          setTimeout(() => this.checkAndAutoLoad('broken'), 100);
        } else {
          this.hasMoreBroken = false;
        }

        this.completeEvent(event);
        this.isLoadingBroken = false;
        this.isRequestingBroken = false;
      },
      (error) => {
        console.error('Error loading broken machines:', error);
        this.completeEvent(event);
        this.isLoadingBroken = false;
        this.isRequestingBroken = false;
      }
    );
  }

  getUserRunning(event?: any) {
    // Prevent multiple concurrent requests
    if (this.isRequestingUser || !this.hasMoreUser) {
      if (event) event.target.complete();
      return;
    }

    this.isRequestingUser = true;

    this.dataService.getForemanTailors(10, this.pageUser,"running","").subscribe(
      (res) => {
        if (res.status && res.data && res.data.length > 0) {
          // Avoid duplicates by checking existing items
          const newItems = res.data.filter((newItem: any) =>
            !this.listUserRunning.some(existingItem => existingItem.id === newItem.id)
          );

          this.listUserRunning = [...this.listUserRunning, ...newItems];
          this.totalPageUser = res.total_page;
          this.totalDataUser = res.total_items;

          // Check if we have more pages
          this.hasMoreUser = this.pageUser < this.totalPageUser;

          if (this.hasMoreUser) {
            this.pageUser++;
          }

          // Auto-load jika container masih belum scrollable dan masih ada data
          setTimeout(() => this.checkAndAutoLoad('user'), 100);
        } else {
          this.hasMoreUser = false;
        }

        this.completeEvent(event);
        this.isLoadingUser = false;
        this.isRequestingUser = false;
      },
      (error) => {
        console.error('Error loading running users:', error);
        this.completeEvent(event);
        this.isLoadingUser = false;
        this.isRequestingUser = false;
      }
    );
  }

  // Method untuk mengecek apakah perlu auto-load data
  checkAndAutoLoad(type: 'user' | 'broken') {
    if (type === 'user' && this.userScrollContainer) {
      const element = this.userScrollContainer.nativeElement;
      if (element.scrollHeight <= element.clientHeight && this.hasMoreUser && !this.isRequestingUser) {
        this.getUserRunning();
      }
    } else if (type === 'broken' && this.brokenScrollContainer) {
      const element = this.brokenScrollContainer.nativeElement;
      if (element.scrollHeight <= element.clientHeight && this.hasMoreBroken && !this.isRequestingBroken) {
        this.getBrokenMachine();
      }
    }
  }

  private completeEvent(event?: any) {
    if (event) {
      event.target.complete();
      // Disable infinite scroll if no more data
      if (!this.hasMoreBroken && !this.hasMoreUser) {
        event.target.disabled = true;
      }
    }
  }

  getRemainingTime(startTime: string | null | undefined, estimationInMinutes: number | null | undefined): string {
    if (!startTime || estimationInMinutes == null) return 'Waktu tidak diketahui';

    const start = new Date(startTime);
    const now = new Date();

    const elapsedMs = now.getTime() - start.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 1000 / 60);
    const remainingMinutes = estimationInMinutes - elapsedMinutes;

    if (remainingMinutes <= 0) return 'Sebentar Lagi';

    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;

    return `${hours} jam ${minutes} menit`;
  }

  formatEstimation(minutes: number | null | undefined): string {
    if (!minutes || minutes <= 0) return 'Tidak ada estimasi';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h} Jam ${m} Menit`;
  }


  onScrollUser(event: any) {
    // Clear existing timeout
    if (this.scrollTimeoutUser) {
      clearTimeout(this.scrollTimeoutUser);
    }

    // Don't trigger if already loading or requesting
    if (this.isLoadingUser || this.isRequestingUser || !this.hasMoreUser) {
      return;
    }

    this.scrollTimeoutUser = setTimeout(() => {
      const target = event.target;
      const threshold = 50; // Trigger when 50px from bottom

      if (target.offsetHeight + target.scrollTop >= target.scrollHeight - threshold) {
        this.getUserRunning();
      }
      this.scrollTimeoutUser = null;
    }, 200);
  }

  onScrollBrokenMachine(event: any) {
    // Clear existing timeout
    if (this.scrollTimeoutBroken) {
      clearTimeout(this.scrollTimeoutBroken);
    }

    // Don't trigger if already loading or requesting
    if (this.isLoadingBroken || this.isRequestingBroken || !this.hasMoreBroken) {
      return;
    }

    this.scrollTimeoutBroken = setTimeout(() => {
      const target = event.target;
      const threshold = 50; // Trigger when 50px from bottom

      if (target.offsetHeight + target.scrollTop >= target.scrollHeight - threshold) {
        this.getBrokenMachine();
      }
      this.scrollTimeoutBroken = null;
    }, 200);
  }
  ionViewWillEnter() {
    // Reset dan reload data saat halaman muncul kembali
    this.refreshBrokenMachine();
    this.refreshUserRunning();
  }


  // Method untuk refresh data
  refreshBrokenMachine(event?: any) {
    this.listBrokenMachine = [];
    this.pageBroken = 1;
    this.hasMoreBroken = true;
    this.isLoadingBroken = true;
    this.getBrokenMachine(event);
  }

  refreshUserRunning(event?: any) {
    this.listUserRunning = [];
    this.pageUser = 1;
    this.hasMoreUser = true;
    this.isLoadingUser = true;
    this.getUserRunning(event);
  }

  goToDetail(report_id: Number){
    this.router.navigate(['/report/update', report_id]);
  }

  getDifficultyIN(difficulty:string):string{
    return getDifficultyIN(difficulty)
  }
  getStatusIN(status:string):string{
    return getStatusReportIN(status)
  }
}
