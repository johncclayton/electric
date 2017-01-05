import {Component, Input} from '@angular/core';

@Component({
  selector: 'charger-status',
  templateUrl: 'charger-status.html'
})
export class ChargerStatusComponent {

  @Input() status;
  @Input() channel;
  chargerStatus: {} = {};
  channelData: {} = {};

  constructor() {
  }

  ngOnChanges(changes) {
    if (this.status) {
      this.status.subscribe((data) => {
        this.chargerStatus = data;
      });
    }
    if (this.channel) {
      this.channel.subscribe((data) => {
        console.log("got: ", data);
        this.channelData = data;
      })
    }
  }

}
