import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private router:Router,
    private http : HttpClient) { }

  public apiUrl = environment.apiUrl;

  private createHeaders(): HttpHeaders {
    return new HttpHeaders()
      .set('Authorization', 'Bearer ' + localStorage.getItem('token'))
      .set('ngrok-skip-browser-warning', 'true');
  }

  login(username:string, password:string):Observable<any>{
    const headers = this.createHeaders()
    const loginData = {username, password};
    return this.http.post(`${this.apiUrl}/auth/login`,loginData,{headers}).pipe(
      tap((resopnse:any)=>{
        localStorage.setItem('id',resopnse.data.id);
        localStorage.setItem('token',resopnse.token);
        localStorage.setItem('name',resopnse.data.name);
        localStorage.setItem('username',resopnse.data.username);
        localStorage.setItem('nik',resopnse.data.nik);
        localStorage.setItem('email',resopnse.data.email);
        localStorage.setItem('role',resopnse.data.role);
        localStorage.setItem('phone_number',resopnse.data.phone_number);

        if(resopnse.data.machine != null){
          localStorage.setItem('machine_id',resopnse.data.machine.id);
        }
      })
    )
  }

  checkTokenValidity(): Observable<any> {
    const headers = this.createHeaders()
      .set('Authorization', 'Bearer ' + localStorage.getItem('token'))
      .set('Accept', 'application/json')

    return this.http.get(`${this.apiUrl}/auth/check-token`, {
      headers,
      responseType: 'json'
    }).pipe(
      catchError(error => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.router.navigate(['/error/500']);
        }
        return throwError(() => error);
      })
    );
  }

  logout(isMobile: boolean):Observable<any>{
    const headers = this.createHeaders()
      .set('Authorization','Bearer '+localStorage.getItem('token'));
    if(isMobile)
      return this.http.post(`${this.apiUrl}/auth/logout-mobile`,[],{headers})
    else
      return this.http.post(`${this.apiUrl}/auth/logout-web`,[],{headers})
  }
}
