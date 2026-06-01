import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth/auth.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'maintenance',
    loadChildren: () => import('./maintenance/maintenance.module').then( m => m.MaintenancePageModule),
    canActivate:[authGuard]
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then( m => m.DashboardPageModule),
    canActivate:[authGuard],
    data:{roles:['foreman','management','tailor','technician']}
  },
  {
    path: 'machine',
    loadChildren: () => import('./pages/machine/machine.module').then( m => m.MachinePageModule),
    canActivate:[authGuard],
    data:{roles:['management','technician']}
  },
  {
    path: ':table/update/:id',
    loadChildren: () => import('./pages/forms/add-update/add-update.module').then( m => m.AddUpdatePageModule),
    canActivate:[authGuard],
    data:{roles:['management','technician','tailor','foreman']}
  },
  {
    path: ':table/add',
    loadChildren: () => import('./pages/forms/add-update/add-update.module').then( m => m.AddUpdatePageModule),
    canActivate:[authGuard],
    data:{roles:['management','technician','tailor','foreman']}
  },
  {
    path: 'user',
    loadChildren: () => import('./pages/user/user.module').then( m => m.UserPageModule),
    canActivate:[authGuard],
    data:{roles:['management','foreman']}
  },
  {
    path: 'report',
    loadChildren: () => import('./pages/report/report.module').then( m => m.ReportPageModule),
    canActivate:[authGuard],
    data:{roles:['management','technician']}
  },
  {
    path: 'error/:code',
    loadChildren: () => import('./pages/error/error/error.module').then( m => m.ErrorPageModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./pages/profile/profile.module').then( m => m.ProfilePageModule)
  },
  {
    path: 'repair/:id',
    loadChildren: () => import('./pages/forms/repair/repair.module').then( m => m.RepairPageModule)
  },
  {
    path: 'sparepart',
    loadChildren: () => import('./pages/sparepart/sparepart.module').then( m => m.SparepartPageModule)
  },
  {
    path: 'broken-machine',
    loadChildren: () => import('./pages/broken-machine/broken-machine.module').then( m => m.BrokenMachinePageModule)
  },
  {
    path: 'category',
    loadChildren: () => import('./pages/category/category.module').then( m => m.CategoryPageModule)
  },
  { path: '**', redirectTo: 'error/404' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
