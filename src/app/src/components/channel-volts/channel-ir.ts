import {ChannelVoltsComponent} from "./channel-volts";
import {Component, Input, Output, EventEmitter} from "@angular/core";
import {Channel} from "../../models/channel";

@Component({
    selector: 'channel-ir',
    templateUrl: 'channel-ir.html'
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