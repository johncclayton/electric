import {ChangeDetectionStrategy, Component, Input} from "@angular/core";
import {Channel} from "../../models/channel";
import * as _ from "lodash";

@Component({
    selector: 'channel-volts',
    templateUrl: 'channel-volts.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelVoltsComponent {
    public maxBalanceSeen: number = 8;
    public balanceScale: number;

    @Input() channel: Channel;
    @Input() index: number;

    constructor() {
    }

    cellChunking() {
        if (this.channel.numberOfCells == 2) {
            return 2;
        }
        if (this.channel.numberOfCells == 1) {
            return 1;
        }

        // Return a multiple of the visible channels
        if (this.channel.numberOfCells % 3 == 0) {
            return 3;
        }
        if (this.channel.numberOfCells % 3 == 1) {
            return 2;
        }

        return 3;
    }

    chunkedCells() {
        if (!this.channel) {
            return [];
        }
        let cells = this.channel.cells;
        if (!cells) {
            return [];
        }

        // Pad so there's an even divisible number of cells by cellChunking()
        while (cells.length % this.cellChunking() != 0) {
            cells.push({v: -1000});
        }

        return _.chunk(cells, this.cellChunking());
    }

    isCellPadding(cell) {
        return cell.v == -1000;
    }

    isCellUnused(cell) {
        return Number(cell.v) < 0.001;
    }

    // Recompute balance max every time we get some more data
    ngOnChanges(changes) {
        let cells = this.channel.cells;
        if (cells) {
            cells.forEach(cell => {
                this.maxBalanceSeen = Math.max(this.maxBalanceSeen, cell.balance)
            });
        }
    }

    /*
     Used to return the number of "bars" in the balance charging cells
     */
    balanceRange(cellBalance) {
        // Scale this to 0-5
        // Most of the time we see values maxing at 8, but I did see higher.
        // So I thought I'd just save the peak I see, and use that over time.
        this.maxBalanceSeen = Math.max(cellBalance, this.maxBalanceSeen);
        this.balanceScale = this.maxBalanceSeen / 5.0;

        // Always return all 5 "bars".
        // The HTML will choose which of these bars to colour based on their "balanceLightIsLit" state.
        return [1, 2, 3, 4, 5];
    }

    /*
     Tells us if a particular "bar" is lit, based on the current balance "value"
     */
    balanceLightIsLit(balanceIndex, balanceValue) {
        let scaledValue = Math.ceil(balanceValue / this.balanceScale);
        return scaledValue >= balanceIndex;
    }
}
