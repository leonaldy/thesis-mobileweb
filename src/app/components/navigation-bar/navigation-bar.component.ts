import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { NavController, Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { AuthService } from 'src/app/service/auth.service';
import { DataService } from 'src/app/service/data.service';
import { FcmService } from 'src/app/service/fcm.service';
import { getPageIN, getProfileImage, isDarkTheme } from 'src/app/util/utils';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-navigation-bar',
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.scss'],
})
export class NavigationBarComponent implements OnInit {
  currentPage = '';
  isProfileShow = false;
  isSidebarShow = false;
  isNotifBoxShow = false;

  // Profile info
  username = localStorage.getItem('username');
  role = localStorage.getItem('role') ?? '';
  email = localStorage.getItem('email');
  phone_number = localStorage.getItem('phone_number');

  private webPollingInterval: any;

  // Notifications
  notifications: any[] = [];
  totalNotif: number = 0;
  statusNotification: boolean = false;

  constructor(
    private authService: AuthService,
    private storage: Storage,
    private router: Router,
    private navCtrl: NavController,
    private cdr: ChangeDetectorRef,
    private fcmService: FcmService,
    private platform: Platform,
    private dataService: DataService,
    private zone: NgZone
  ) {}

  async ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.onRouteChange(event.url);
      }
    });
    this.onRouteChange(this.router.url);

    this.checkStatusNotification();
    this.fcmService.initPush();
    this.listenPushNotifications();
  }

  onRouteChange(url: string) {
    this.currentPage = url.split('/')[1];
    this.isProfileShow = false;
    this.cdr.detectChanges();
  }

  logout() {
    const dark = isDarkTheme();

    Swal.fire({
      title: 'Konfirmasi Keluar',
      text: 'Apakah Anda yakin ingin keluar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, keluar',
      cancelButtonText: 'Batal',
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
    }).then(({ isConfirmed }) => {
      if (!isConfirmed) return;

      const isMobile = this.platform.is('mobile') || this.platform.is('ios') || this.platform.is('capacitor');

      this.authService.logout(isMobile).subscribe(({ status }) => {
        if (!status) return;

        this.router.navigate(['/login']);
        const theme = localStorage.getItem('mode');
        localStorage.clear();
        this.storage.clear();
        if (theme) localStorage.setItem("mode", theme);

        this.fcmService.clearPushNotifications();
      });

      if (this.webPollingInterval) {
        clearInterval(this.webPollingInterval);
      }
    });
  }


  switchTheme() {
    const rootElement = document.getElementById('root');
    const isDark = localStorage.getItem('mode') === 'dark';

    if (isDark) {
      rootElement?.classList.remove('dark');
      localStorage.removeItem('mode');
    } else {
      rootElement?.classList.add('dark');
      localStorage.setItem('mode', 'dark');
    }
  }

  redirectTo(route: string) {
    this.isSidebarShow = false;
    this.navCtrl.navigateRoot('/' + route);
  }

  hiddenFor(roles: string[]): boolean {
    return roles.some(role => role === this.role);
  }

  getNotifications() {
    this.dataService.getNotification(100, 1).subscribe(res => {
      console.log('Response Notification:', res.data);
      this.notifications = res.data;
      this.totalNotif = res.total_items;
      this.statusNotification = false;
    });
  }

  listenPushNotifications() {
    const isMobilePlatform = this.platform.is('mobile') || this.platform.is('ios') ||
                            this.platform.is('android') || this.platform.is('capacitor');

    if (isMobilePlatform) {
      console.log('Subscribing to push notification listener (mobile)...');

      this.fcmService.onPushNotificationReceived().subscribe(notif => {
        console.log('Push received di foreground (mobile):', notif);
        this.zone.run(() => {
          this.checkStatusNotification();
        });
      });
    } else {
      console.log('Polling notification on web platform every 15 seconds...');

      this.webPollingInterval = setInterval(() => {
        this.zone.run(() => {
          this.checkStatusNotification();
        });
      }, 15000); // 15000ms = 15 detik
    }
  }


  checkStatusNotification() {
    this.dataService.getStatusNotification().subscribe(response => {
      this.statusNotification = response.has_unread;
    });
  }

  showNotifBox(boolean: boolean) {
    this.isNotifBoxShow = boolean;
    if (this.isNotifBoxShow) {
      this.getNotifications();
    }
  }

  formatTime(createdAt: string): string {
    const now = new Date();
    const notifDate = new Date(createdAt);
    const diffInMs = now.getTime() - notifDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return notifDate.toLocaleDateString();
  }

  ngOnDestroy() {
    if (this.webPollingInterval) {
      clearInterval(this.webPollingInterval);
    }
  }

  getProfileImage(role: string | null): string {
    return getProfileImage(role)
  }

  getPageIN(page: string):string{
    return getPageIN(page);
  }
}
