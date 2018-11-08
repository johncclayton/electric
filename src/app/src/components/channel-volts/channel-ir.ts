import {ChannelVoltsComponent} from "./channel-volts";
import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from "@angular/core";
import {Channel} from "../../models/channel";

@Component({
  selector: 'channel-ir',
  templateUrl: 'channel-ir.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelIRComponent extends ChannelVoltsComponent {
  @Input() channel: Channel;
  @Input() index: number;

  @Output() back = new EventEmitter();

  constructor() {
    super();
  }

  goBack() {
    this.back.next();
  }
}
