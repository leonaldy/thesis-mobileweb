import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CacheService } from 'ionic-cache';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export type ExportType =
  | 'machines_damage'
  | 'spareparts_per_machine'
  | 'repairs_per_technician'
  | 'damages_per_tailor'
  | 'durations_per_category'
  | 'machines_damage_per_month';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  public apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private cache: CacheService,
    private router: Router
  ) {
    cache.setDefaultTTL(60 * 5);
  }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders()
      .set('Authorization', 'Bearer ' + localStorage.getItem('token'))
      .set('ngrok-skip-browser-warning', 'true');
  }

  private createExportHeaders(): HttpHeaders {
    return new HttpHeaders()
      .set('Authorization', 'Bearer ' + localStorage.getItem('token'))
      .set('ngrok-skip-browser-warning', 'true')
      .set('Accept', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }

  extractFilename(res: HttpResponse<Blob>, fallback: string): string {
    const dispo = res.headers.get('content-disposition') || '';
    const match = /filename\*?=(?:UTF-8''|")?([^";]+)"?$/i.exec(dispo);
    try {
      const raw = match?.[1] ?? fallback;
      return decodeURIComponent(raw);
    } catch {
      return fallback;
    }
  }

  private handleError = (error: HttpErrorResponse) => {
    if (error.status === 401) {
      console.log(localStorage.getItem('token'));
      this.router.navigate(['/login']);
      localStorage.clear();
    } else {
      this.router.navigate(['/error/500']);
    }
    return throwError(() => error);
  };

  //Export Dashboard
  exportReports(type: ExportType, from: string, to: string): Observable<HttpResponse<Blob>> {
    const url = `${this.apiUrl}/exports/reports`;
    const headers = this.createExportHeaders();
    const params = new HttpParams().set('type', type).set('from', from).set('to', to);

    return this.http.get(url, { headers, params, responseType: 'blob', observe: 'response' });
  }

  exportReportsByYear(type: ExportType, year: number): Observable<HttpResponse<Blob>> {
    const url = `${this.apiUrl}/exports/reports`;
    const headers = this.createExportHeaders();
    const params = new HttpParams()
      .set('type', type)
      .set('year', String(year));

    return this.http.get(url, { headers, params, responseType: 'blob', observe: 'response' });
  }

  // Dashboard
  getQueueDashboard(): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(`${this.apiUrl}/report?page=1&size=3&status=request`, { headers });
  }

  getTechnicianInformation(): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(`${this.apiUrl}/users/check-technician`, { headers });
  }

  // Machines
  getMachines(size: number, page: number, search: string): Observable<any> {
    const url = `${this.apiUrl}/machine?page=${page}&size=${size}&search=${search}`;
    const headers = this.createHeaders();
    const request = this.http.get(url, { headers, observe: 'response' });
    return this.cache.loadFromObservable(url, request, 'machines').pipe(
      map(res => res.body)
    );
  }

  deleteMachine(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.delete(`${this.apiUrl}/machine/${id}`, { headers }).pipe(
      tap(() => this.cache.clearGroup('machines'))
    );
  }

  insertMachine(data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/machine`, data, { headers }).pipe(
      tap(() => this.cache.clearGroup('machines'))
    );
  }

  getMachine(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(`${this.apiUrl}/machine/${id}`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        this.router.navigate(['/error/404'], { replaceUrl: true });
        return of(null);
      })
    );
  }

  updateMachine(data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/machine/${data.id}`, data, { headers }).pipe(
      tap(() => this.cache.clearGroup('machines'))
    );
  }

  // Users
  getUsers(size: number, page: number, role: string | null, search: string = ""): Observable<any> {
    const roleQuery = role ?? "";
    const url = `${this.apiUrl}/users?page=${page}&size=${size}&search=${search}&role=${roleQuery}`;
    const headers = this.createHeaders();
    const request = this.http.get(url, { headers, observe: 'response' });

    return this.cache.loadFromObservable(url, request, 'users').pipe(
      map(res => res.body),
      catchError(error => {
        if (error.status === 401) {
          console.log(localStorage.getItem('token'));
          this.router.navigate(['/login']);
          localStorage.clear();
        } else {
          this.router.navigate(['/error/500']);
        }
        this.cache.clearGroup('users');
        return throwError(() => error);
      })
    );
  }

  getForemanTailors(
    size: number,
    page: number,
    status: string = '',
    search: string = ''
  ): Observable<any> {
    let params: any = {
      page,
      size
    };

    if (status) {
      params.status = status;
    }

    if (search) {
      params.search = search;
    }

    const url = `${this.apiUrl}/users/foreman-tailors`;

    const headers = this.createHeaders();

    return this.http.get(url, { headers, params, observe: 'response' }).pipe(
      map(res => res.body),
      catchError(this.handleError)
    );
  }

  deleteUser(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.delete(`${this.apiUrl}/users/${id}`, { headers }).pipe(
      tap(() => this.cache.clearGroup('users'))
    );
  }

  insertUser(data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/users`, data, { headers }).pipe(
      tap(() => this.cache.clearGroup('users'))
    );
  }

  getUser(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(`${this.apiUrl}/users/${id}`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        this.router.navigate(['/error/404'], { replaceUrl: true });
        return of(null);
      })
    );
  }

  updateUser(data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/users/${data.id}`, data, { headers }).pipe(
      tap(() => this.cache.clearGroup('users'))
    );
  }

  // Reports
  getReports(size: number, page: number, search: string, status: string = ""): Observable<any> {
    const statusParam = status ? `&status=${status}` : "";
    const url = `${this.apiUrl}/report?page=${page}&size=${size}&search=${search}${statusParam}`;
    const headers = this.createHeaders();
    const request = this.http.get(url, { headers, observe: 'response' });

    // return this.cache.loadFromObservable(url, request, 'reports').pipe(
    //   map(res => res.body)
    // );
    return request.pipe(
      map(res => res.body)
    );
  }

  deleteReport(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.delete(`${this.apiUrl}/report/${id}`, { headers }).pipe(
      tap(() => this.cache.clearGroup('reports'))
    );
  }

  insertReport(data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/report`, data, { headers }).pipe(
      tap(() => this.cache.clearGroup('reports'))
    );
  }

  getReport(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(`${this.apiUrl}/report/${id}`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        this.router.navigate(['/error/404'], { replaceUrl: true });
        return of(null);
      })
    );
  }

  updateReport(data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/report/${data.id}`, data, { headers }).pipe(
      tap(() => this.cache.clearGroup('reports'))
    );
  }

  getReportForeman(size: number, page: number, search: string, status: string = ""): Observable<any> {
    const statusParam = status ? `&status=${status}` : "";
    const url = `${this.apiUrl}/report/foreman-tailors?page=${page}&size=${size}&search=${search}${statusParam}`;
    const headers = this.createHeaders();
    const request = this.http.get(url, { headers, observe: 'response' });

    return request.pipe(
      map(res => res.body)
    );
  }

  cancelReport(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/report/${id}/cancel`, {}, { headers }).pipe(
      tap(() => this.cache.clearGroup('reports'))
    );
  }


  // User Machine
  removeUserMachine(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.delete(`${this.apiUrl}/user-machine/remove/${id}`, { headers }).pipe(
      tap(() => this.cache.clearGroup('user_machine'))
    );
  }

  addUserMachine(data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/user-machine/set`, data, { headers }).pipe(
      tap(() => this.cache.clearGroup('user_machine'))
    );
  }

  getUserMachines(size: number, page: number, search: string): Observable<any> {
    const url = `${this.apiUrl}/user-machine?page=${page}&size=${size}&search=${search}`;
    const headers = this.createHeaders();
    const request = this.http.get(url, { headers, observe: 'response' });

    // return this.cache.loadFromObservable(url, request, 'user_machine').pipe(
    //   map(res => res.body)
    // );
    return request.pipe(
      map(res => res.body)
    );
  }

  // Notifications
  setFCMToken(data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/notification/setToken`, data, { headers });
  }

  // Repair
  startRepair(id: number, category_id: number | null): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/repair/start/${id}`, { category_id }, { headers });
  }

  endRepair(data: any, id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/repair/end/${id}`, data, { headers }).pipe(
      tap(() => {
        this.cache.clearGroup('reports')
        this.cache.clearGroup('spareparts');
      })
    );
  }

  pauseRepair(id: number, reason: string): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/repair/pause/${id}`, { reason }, { headers }).pipe(
      tap(() => {
        this.cache.clearGroup('reports');
      })
    );
  }

  // Charts
  getTotalMachineCrashedperMonth(year: number = 2025): Observable<any> {
    const url = `${this.apiUrl}/chart/machine-total-crashed-permonth?year=${year}`;
    const headers = this.createHeaders();
    return this.http.get<any>(url, { headers });
  }

  getMachineCrashedperYear(year: number = 2025): Observable<any> {
    const url = `${this.apiUrl}/chart/machine-crashed-peryear?year=${year}`;
    const headers = this.createHeaders();
    return this.http.get<any>(url, { headers });
  }

  getTechnicianRepairperYear(year: number = 2025): Observable<any> {
    const url = `${this.apiUrl}/chart/technician-repair-peryear?year=${year}`;
    const headers = this.createHeaders();
    return this.http.get<any>(url, { headers });
  }

  getUserReportperYear(year: number = 2025): Observable<any> {
    const url = `${this.apiUrl}/chart/user-report-peryear?year=${year}`;
    const headers = this.createHeaders();
    return this.http.get<any>(url, { headers });
  }

  getSummarybyCategory(year: number = 2025, month: number = 1, difficulty: string = ""): Observable<any> {
    const url = `${this.apiUrl}/chart/summary-by-category?year=${year}&month=${month}&difficulty=${difficulty}`;
    const headers = this.createHeaders();
    return this.http.get<any>(url, { headers });
  }

  getSparepartTrendperMonth(year: number = 2025): Observable<any> {
    const url = `${this.apiUrl}/chart/sparepart-trend-top-types-permonth?year=${year}$top=10`;
    const headers = this.createHeaders();
    return this.http.get<any>(url, { headers });
  }

  getReportByForemanCategory(
    foremanId: number,
    year: number = new Date().getFullYear(),
    month: number = new Date().getMonth() + 1
  ): Observable<any> {
    const params = new HttpParams()
      .set('foreman_id', foremanId.toString())
      .set('year', year.toString())
      .set('month', month.toString());

    const url = `${this.apiUrl}/chart/summary-foreman-by-category`;
    const headers = this.createHeaders();

    return this.http.get<any>(url, { headers, params });
  }

  // Categories
  getCategories(size?: number, page: number = 1, search: string = ''): Observable<any> {
    let url = `${this.apiUrl}/category?page=${page}&search=${search}`;

    if (size) {
      url += `&size=${size}`;
    }

    const headers = this.createHeaders();
    const request = this.http.get(url, { headers, observe: 'response' });

    return this.cache.loadFromObservable(url, request, 'categories').pipe(
      map(res => res.body)
    );
  }


  deleteCategory(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.delete(`${this.apiUrl}/category/${id}`, { headers }).pipe(
      tap(() => this.cache.clearGroup('categories'))
    );
  }

  insertCategory(data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/category`, data, { headers }).pipe(
      tap(() => this.cache.clearGroup('categories'))
    );
  }

  getCategory(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(`${this.apiUrl}/category/${id}`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        this.router.navigate(['/error/404'], { replaceUrl: true });
        return of(null);
      })
    );
  }

  updateCategory(data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/category/${data.id}`, data, { headers }).pipe(
      tap(() => this.cache.clearGroup('categories'))
    );
  }

  // Spareparts
  getSpareparts(size: number, page: number, search: string): Observable<any> {
    const url = `${this.apiUrl}/sparepart?page=${page}&size=${size}&search=${search}`;
    const headers = this.createHeaders();
    const request = this.http.get(url, { headers, observe: 'response' });

    return this.cache.loadFromObservable(url, request, 'spareparts').pipe(
      map(res => res.body)
    );
  }

  deleteSparepart(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.delete(`${this.apiUrl}/sparepart/${id}`, { headers }).pipe(
      tap(() => this.cache.clearGroup('spareparts'))
    );
  }

  insertSparepart(data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/sparepart`, data, { headers }).pipe(
      tap(() => this.cache.clearGroup('spareparts'))
    );
  }

  getSparepart(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.get(`${this.apiUrl}/sparepart/${id}`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        this.router.navigate(['/error/404'], { replaceUrl: true });
        return of(null);
      })
    );
  }

  updateSparepart(data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post(`${this.apiUrl}/sparepart/${data.id}`, data, { headers }).pipe(
      tap(() => this.cache.clearGroup('spareparts'))
    );
  }

  //Notification
  getNotification(size: number, page: number): Observable<any> {
    const url = `${this.apiUrl}/notification?page=${page}&size=${size}`;
    const headers = this.createHeaders();
    const request = this.http.get(url, { headers, observe: 'response' });

    return request.pipe(
      map(res => res.body)
    );
  }
  getStatusNotification(): Observable<any> {
    const url = `${this.apiUrl}/notification/check-notification`;
    const headers = this.createHeaders();

    return this.http.get(url, { headers, observe: 'response' }).pipe(
      map(res => res.body),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
          localStorage.clear();
        } else if (error.status >= 500) {
          this.router.navigate(['/error/500']);
        }
        return of(null);
      })
    );
  }

}
