import { Router } from '@angular/router';
import { AuthService } from './../service/auth.service';
import { Component, OnInit } from '@angular/core';
import { FcmService } from '../service/fcm.service';
import { extractErrorMessage } from '../util/utils';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  username = '';
  password = '';
  isShowPassword=false;

  role :string | null = '';
  isLoadingProcess=false;

  isError=false;
  messageError='';

  constructor(
    private authService:AuthService,
    private router:Router
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter(){
    (document.getElementById('loader') as HTMLElement).classList.remove('hidden');
    if(localStorage.getItem('token')){
      this.authService.checkTokenValidity().subscribe(
        ()=>{
          this.role =  localStorage.getItem('role')
          this.redirectUser(this.role)
        },
        (error)=>{
          console.log(error);
          window.location.replace('/error/500');
          // localStorage.removeItem('token');
          (document.getElementById('loader') as HTMLElement).classList.add('hidden');
        }
      );
    }else{
      (document.getElementById('loader') as HTMLElement).classList.add('hidden');
    }
  }

  login(){
    try{
      this.isLoadingProcess = true;
      this.authService.login(this.username, this.password).subscribe(
        (response)=>{
          console.log(response.data)
          window.location.reload();
        },
        (error)=>{
          if(error.status == 0){
            window.location.replace('/error/500');
          }else{
            this.setError(extractErrorMessage(error));
            this.isLoadingProcess = false;
          }
        }
      )
    }catch(error){
      console.log("Message Error : "+error)
    }
  }

  redirectUser(role: string | null) {
    if (!role) {
      this.router.navigate(['/dashboard']);
      return;
    }

    switch (role) {
      case 'foreman':
        this.router.navigate(['/broken-machine']);
        break;
      case 'tailor':
        this.router.navigate(['/profile']);
        break;
      default:
        this.router.navigate(['/dashboard']);
        break;
    }
  }

  setError(message:string){
    this.isError = true;
    this.messageError = message;
  }
  clearError(){
    this.isError = false;
    this.messageError = '';
  }
}
