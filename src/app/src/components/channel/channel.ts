import {Component, Input, trigger, state, style, transition, animate} from "@angular/core";
import * as _ from "lodash";

/*
 control_status: 3, run_status: 13 - discharging
 control_status: 0, run_status: 1 - pressed stop after discharging
 control_status: 0, run_status: 0 - pressed stop again, idle
 control_status: 0, run_status: 40 - end of charge, done
 */
@Component({
    selector: 'channel',
    templateUrl: 'channel.html',
    animations: [
        trigger('flip', [
            state('flipped', style({
                transform: 'rotate(180deg)',
                backgroundColor: 'red'
            })),
            transition('* => flipped', animate('400ms ease'))
        ]),

        trigger('fade', [
            transition(':enter', [
                style({opacity: 0}),
                animate(500, style({opacity: 1}))
            ]),
            transition(':leave', [
                style({opacity: 1}),
                animate(500, style({opacity: 0}))
            ])
        ])
    ]
})
export class ChannelComponent {
    public data: {} = {};
    public channel: {} = {};
    public maxBalanceSeen: number = 8;
    public balanceScale: number;
    public channelMode: number;
    public masterHeight: number;

    @Input() channelObserver;
    @Input() name: string;

    private channelSubscription;

    constructor() {
        this.channelMode = 0;
    }

    toggleChannelMode() {
        this.channelMode++;
        if (this.channelMode > 1) {
            this.channelMode = 0;
        }

        // Store the master height (the height of the cells).
        // We want other panels to have this same height as a minimum
        let elementById = document.getElementById("master");
        if (elementById) {
            this.masterHeight = elementById.offsetHeight;
        }

        console.log("Switch mode to ", this.channelMode);
    }

    cellChunking() {
        // Return a multiple of the visible channels
        if(this.data['cellLimit'] % 3 == 1) {
            return 2;
        }
        return 3;
    }

    chunkedCells() {
        if (!this.data['cellLimit']) {
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

    ngAfterViewInit() {
    }

    ngOnDestroy() {
        console.log("Leaving channel: ", this.channel['channel']);
        if (this.channelSubscription) {
            console.log("Channel ", this.channel['channel'], " going away, unsubscribing");
            this.channelSubscription.unsubscribe();
            this.channelSubscription = null;
        }
    }

    ngOnChanges(changes) {
        console.log("Channel is seeing change to bound data: ", changes);
        if (this.channelObserver) {
            console.log("Channel binding to ", this.channelObserver);
            this.channelSubscription = this.channelObserver.subscribe((data) => {
                if (data) {
                    let haveAnyData = data['json'];
                    if (haveAnyData) {
                        this.data = data;
                        this.channel = data['json'];

                        let cells = this.channel['cells'];
                        cells.forEach(thing => {
                            this.maxBalanceSeen = Math.max(this.maxBalanceSeen, thing.balance)
                        });
                    }
                }
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

        let minimum: number = 9999999;
        let maximum: number = 0;
        let iterations: number = 0;

        cells.forEach(cell => {
            let cellVolts: number = cell['v'];
            if (cellVolts > 0 && cellVolts < 100) {
                minimum = Math.min(cellVolts, minimum);
                maximum = Math.max(cellVolts, maximum);
                iterations++;
            }
        });

        if (iterations == 0) {
            return 0.0;
        }
        // console.log("max: ", maximum, " min", minimum);
        return (maximum - minimum) * 1000.0;
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
