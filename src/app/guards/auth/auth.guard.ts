import { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/service/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    return authService.checkTokenValidity().pipe(
      map((isValid: boolean) => {
        if (isValid) {
          const hasRoleAccess = checkRole(route, router);
          return hasRoleAccess;
        } else {
          router.navigate(['/login']);
          return false;
        }
      }),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  } else {
    router.navigate(['/login']);
    return of(false);
  }
};

function checkRole(route: ActivatedRouteSnapshot, router: Router): boolean {
  let allowedRoles = route.data['roles'] as Array<string>;
  const role = localStorage.getItem('role');
  const table = route.paramMap.get('table');

  if (table !== null) {
    switch (table) {
      case 'machine':
        allowedRoles = ['management', 'technician'];
        break;
      case 'user':
        allowedRoles = ['foreman', 'management'];
        break;
      case 'report':
        allowedRoles = ['foreman', 'management', 'tailor'];
        break;
      case 'sparepart':
        allowedRoles = ['management', 'technician', 'tailor'];
        break;
      case 'category':
        allowedRoles = ['management', 'technician'];
        break;
      default:
        router.navigate(['/error/404']);
        return false;
    }
  }

  if (allowedRoles.includes(role + '')) {
    return true;
  } else {
    router.navigate(['/error/404']);
    return false;
  }
}
