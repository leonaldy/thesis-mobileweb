import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  showNavbar = true;
  private readonly noNavbarRoutes = ['/login', '/error/404', '/error/403', '/error/500'];

  private routerSub?: Subscription;
  private notifSub?: PluginListenerHandle;

  constructor(private router: Router) {}

  async ngOnInit(): Promise<void> {
    // Router events
    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.checkNavbarVisibility(event.urlAfterRedirects);
        document.getElementById('loader')?.classList.add('hidden');
      }
    });

    // Notifikasi: permissions + listener
    if (Capacitor.isNativePlatform()) {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') await LocalNotifications.requestPermissions();

      this.notifSub = await LocalNotifications.addListener(
        'localNotificationActionPerformed',
        async (event) => {
          const extra = event.notification?.extra as
            | { path?: string; directory?: Directory; route?: string }
            | undefined;

          if (extra?.path && extra?.directory) {
            try {
              const { uri } = await Filesystem.getUri({
                path: extra.path,
                directory: extra.directory,
              });

              const mime = getExcelMime(extra.path);

              await FileOpener.openFile({
                path: uri,
                mimeType: mime,
              });
              return;
            } catch (e) {
              console.error('Gagal membuka file dari notif:', e);
            }
          }

          if (extra?.route) {
            this.router.navigateByUrl(extra.route).catch(console.error);
            return;
          }
        }
      );
    }
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.notifSub?.remove?.();
  }

  private checkNavbarVisibility(url: string): void {
    this.showNavbar = !this.noNavbarRoutes.includes(url);
  }
}

interface PluginListenerHandle { remove: () => Promise<void>; }

// ===== Helpers =====
function getExcelMime(fileName: string): string | undefined {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  if (lower.endsWith('.xls')) {
    return 'application/vnd.ms-excel';
  }
  return undefined;
}
