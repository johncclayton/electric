import {Component} from '@angular/core';

import {NavController} from 'ionic-angular';
import {Observable} from 'rxjs';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  isConnected: Boolean = false;
  chargerStatus: Observable<any>;

  private chargerStatusSubscription: Observable<any>;

  constructor(public navCtrl: NavController) {

  }

  ionViewWillEnter() {
    // Need to poll for charger state
    this.streamChargerStatus().subscribe();
  }

  ionViewWillLeave() {
    this.chargerStatusSubscription = null;
  }

  streamChargerStatus(): Observable<any> {
    this.chargerStatusSubscription = Observable
      .timer(1000)
      .flatMap(() => {
        this.isConnected = true;
        return this.getChargerStatus()
          .catch(() => {
            this.isConnected = false;
            console.log("Cant get status")
          });
      })
      .repeat()
      .share();
    return this.chargerStatusSubscription;
  }

  getChargerStatus() {
    return this.loadFromURL("http://localhost:5000/status")
  }

  retryStrategy(attempts = 4, delay = 1000) {
    return function (errors) {
      return errors
        .scan((acc, value) => {
          acc += 1;
          if (acc < attempts) {
            return acc;
          } else {
            throw new Error(value);
          }
        }, 0)
        .delay(delay);
    }
  }

  loadFromURL(url: string) {
    return Observable.create(observer => {
      console.log("Loading URL: ${url");
      let xhr = new XMLHttpRequest();

      let onLoad = () => {
        if (xhr.status == 200) {
          let data = JSON.parse(xhr.responseText);
          observer.next(data);
          observer.complete();
        } else {
          observer.error(xhr.statusText);
        }
      };
      xhr.addEventListener("load", onLoad);
      xhr.open("GET", url);
      xhr.send();

      return () => {
        xhr.removeEventListener("load", onLoad);
        xhr.abort();
      };
    }).retryWhen(this.retryStrategy());
  }
}
