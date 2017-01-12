import {Component, Input} from "@angular/core";
import * as _ from "lodash";

/*
 control_status: 3, run_status: 13 - discharging
 control_status: 0, run_status: 1 - pressed stop after discharging
 control_status: 0, run_status: 0 - pressed stop again, idle
 control_status: 0, run_status: 40 - end of charge, done
 */
@Component({
    selector: 'channel',
    templateUrl: 'channel.html'
})
export class ChannelComponent {
    public channel: {} = {};
    public maxBalanceSeen: number = 8;
    public balanceScale: number;

    @Input() channelObserver;
    @Input() name: string;

    cellChunking() {
        return 3;
    }

    chunkedCells() {
        if (!this.channel['cells']) {
            return [];
        }
        let cells = this.channel['cells'];

        // Pad so there's an even divisible number of cells by cellChunking()
        while (cells.length % this.cellChunking() != 0) {
            cells.push({v: -1000});
        }

        if (this.channel) {
            return _.chunk(cells, this.cellChunking());
        }
        return null;
    }

    ngOnChanges(changes) {
        console.log("Channel is seeing change to bound data: ", changes);
        if (this.channelObserver) {
            console.log("Channel binding to ", this.channelObserver);
            this.channelObserver.subscribe((data) => {
                data['cells'].forEach(thing => {
                    this.maxBalanceSeen = Math.max(this.maxBalanceSeen, thing.balance)
                });
                // let i = 1;
                // let newCells = JSON.parse(JSON.stringify(data['cells']));
                // for (let cell in newCells) {
                //     newCells[i - 1]['balance'] = i++;
                // }
                // data['cells'] = newCells;
                this.channel = data;
            });
        }
    }

    isCellPadding(cell) {
        return cell.v == -1000;
    }

    isCellUnused(cell) {
        return Number(cell.v) < 0.001;
    }

    voltsSum(channel) {
        if (!channel) {
            return 0;
        }
        let cells = channel['cells'];
        if (!cells) {
            return 0;
        }

        let total = 0;
        cells.forEach(cell => {
            total += cell['v'];
        });
        return total;
    }

    maxMilliVoltDiff(channel) {
        if (!channel) {
            return 0;
        }
        let cells = channel['cells'];
        if (!cells) {
            return 0;
        }

        let minimum: number = 500;
        let maximum: number = 0;

        cells.forEach(cell => {
            let cellVolts: number = cell['v'];
            minimum = Math.min(cellVolts, minimum);
            maximum = Math.max(cellVolts, maximum);

        });

        return maximum - minimum;
    }

    /*
     Return a value from 0-5 inclusive, that indicates the 'amount' of balancing on this connector.
     I think I've seen values up to 11...
     */
    balanceRange(cellBalance) {
        this.maxBalanceSeen = Math.max(cellBalance, this.maxBalanceSeen);
        // Scale this to 0-5
        this.balanceScale = this.maxBalanceSeen / 5.0;

        // Always return all 5 "bars".
        return [1, 2, 3, 4, 5];
    }

    balanceLightIsLit(balanceIndex, balanceValue) {
        let scaledValue = Math.ceil(balanceValue / this.balanceScale);
        return scaledValue >= balanceIndex;
    }
}
