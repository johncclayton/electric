import {Component, Input} from "@angular/core";
import * as _ from "lodash";

@Component({
    selector: 'channel',
    templateUrl: 'channel.html'
})
export class ChannelComponent {
    public channel: {} = {};

    @Input() channelObserver;
    @Input() name: string;

    cellChunking() {
        return 3;
    }
    chunkedCells() {
        if (this.channel) {
            return _.chunk(this.channel['cells'], this.cellChunking());
        }
        return null;
    }

    ngOnChanges(changes) {
        console.log("Channel is seeing change to bound data: ", changes);
        if (this.channelObserver) {
            console.log("Channel binding to ", this.channelObserver);
            this.channelObserver.subscribe((data) => {
                this.channel = data;
            });
        }
    }

    isCellUnused(cell) {
        return Number(cell.v) < 0.001;
    }
}
