import { Injectable } from '@angular/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { DataService } from './data.service';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  private notificationSubject = new Subject<any>();

  constructor(
    private dataService: DataService
  ) { }

  async initPush() {
    if (Capacitor.getPlatform() !== 'web') {
      try {
        // Register notifications first
        await this.registerNotifications();

        // Add listeners
        await this.addListeners();

        // Get FCM token
        const token = await FirebaseMessaging.getToken();
        console.log("Device Token: " + token.token);
        localStorage.setItem('fcm_token', token.token);

        // Send token to server
        this.dataService.setFCMToken({ 'fcm_token': token.token }).subscribe(
          (response) => { console.log(response); }
        );
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    } else {
      console.log('Push notifications not supported on web platform');
    }
  }

  async clearPushNotifications() {
    if (Capacitor.getPlatform() !== 'web') {
      try {
        await FirebaseMessaging.deleteToken();
        console.log('FCM Token deleted');
      } catch (error) {
        console.error('Error deleting FCM token:', error);
      }
    }
  }

  addListeners = async () => {
    await FirebaseMessaging.addListener('notificationReceived', notification => {
      console.log('FirebaseMessaging notification received:', notification);
      this.notificationSubject.next(notification);
    });

    await PushNotifications.addListener('registration', token => {
      console.info('Registration token: ', token.value);
    });

    await PushNotifications.addListener('registrationError', err => {
      console.error('Registration error: ', err.error);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
      console.log('Action performed', notification.actionId, notification.inputValue);
    });
  };


  registerNotifications = async () => {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('User denied permissions!');
    }

    await PushNotifications.register();
  }

  getDeliveredNotifications = async () => {
    const notificationList = await PushNotifications.getDeliveredNotifications();
    console.log('delivered notifications', notificationList);
  }

  onPushNotificationReceived(): Observable<any> {
    return this.notificationSubject.asObservable();
  }
}
