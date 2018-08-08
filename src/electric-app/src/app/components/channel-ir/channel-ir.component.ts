import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ChannelVoltsComponent} from '../channel-volts/channel-volts.component';
import {Channel} from '../../models/channel';

@Component({
    selector: 'channel-ir',
    templateUrl: './channel-ir.component.html',
    styleUrls: ['./channel-ir.component.scss']
})
export class ChannelIRComponent extends ChannelVoltsComponent implements OnInit {

    constructor() {
        super();
    }

    ngOnInit() {
    }

    @Input() channel: Channel;
    @Input() index: number;

    @Output() back = new EventEmitter();

    goBack() {
        this.back.next();
    }
}
