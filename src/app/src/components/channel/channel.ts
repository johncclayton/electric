import {Component, Input, trigger, state, style, transition, animate} from "@angular/core";
import * as _ from "lodash";
import {iChargerService} from "../../services/icharger.service";
import {Channel} from "../../models/channel";

enum ChannelDisplay {
    ChannelDisplayNothingPluggedIn,
    ChannelDisplayShowCellVolts,
    ChannelDisplayShowOptions,
}

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
    public channel: Channel = null;
    public maxBalanceSeen: number = 8;
    public balanceScale: number;
    public channelMode: number = ChannelDisplay.ChannelDisplayNothingPluggedIn;
    public masterHeight: number;

    @Input() channelObserver;
    @Input() index: number;
    @Input() name: string;

    private channelSubscription;

    constructor(public chargerService: iChargerService) {
        this.channelMode = ChannelDisplay.ChannelDisplayNothingPluggedIn;
        this.channel = this.chargerService.emptyData(0);
    }

    getChannelMode() {
        return this.channelMode;
    }

    switchToCellOutput() {
        this.channelMode = ChannelDisplay.ChannelDisplayShowCellVolts;
    }

    startCharge() {

    }

    startDischarge() {

    }

    startBalance() {

    }

    startStore() {

    }

    meaureIR() {

    }

    toggleChannelMode() {
        this.channelMode++;
        if (this.channelMode > ChannelDisplay.ChannelDisplayShowOptions) {
            this.channelMode = ChannelDisplay.ChannelDisplayShowCellVolts;
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

    ionViewDidLoad() {
        console.log("View is initialized");
        this.channel = this.chargerService.emptyData(this.index);
    }

    ngOnDestroy() {
        console.log("Leaving channel: ", this.channel);
        if (this.channelSubscription) {
            console.log("Channel ", this.channel.index, " going away, unsubscribing");
            this.channelSubscription.unsubscribe();
            this.channelSubscription = null;
        }
    }

    ngOnChanges(changes) {
        console.log("Channel is seeing change to bound data: ", changes);
        if (this.channelObserver) {
            console.log("Channel binding to ", this.channelObserver);
            this.channelSubscription = this.channelObserver.subscribe((channelObject) => {
                this.channel = channelObject;
                let cells = this.channel.cells;
                if (cells) {
                    cells.forEach(cell => {
                        this.maxBalanceSeen = Math.max(this.maxBalanceSeen, cell.balance)
                    });

                    if (this.channelMode == ChannelDisplay.ChannelDisplayNothingPluggedIn) {
                        this.channelMode = ChannelDisplay.ChannelDisplayShowCellVolts;
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
