import {Component, Input, trigger, state, style, transition, animate} from "@angular/core";
import {iChargerService} from "../../services/icharger.service";
import {Channel} from "../../models/channel";
import {ActionSheetController, NavController} from "ionic-angular";
import {ChargeOptionsPage} from "../../pages/charge-options/charge-options";

enum ChannelDisplay {
    ChannelDisplayNothingPluggedIn,
    ChannelDisplayShowCellVolts,
    ChannelDisplayShowIR,
    ChannelDisplayShowChart,
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
    public channelMode: number = ChannelDisplay.ChannelDisplayNothingPluggedIn;

    @Input() channelObserver;
    @Input() index: number;
    @Input() name: string;

    private channelSubscription;
    private firstTime: boolean;

    constructor(public chargerService: iChargerService,
                public navCtrlr: NavController,
                public actionController: ActionSheetController,) {
        this.channelMode = ChannelDisplay.ChannelDisplayNothingPluggedIn;
        this.channel = this.chargerService.emptyData(0);
        this.firstTime = true;
    }

    getChannelMode() {
        return this.channelMode;
    }

    showCellVoltage() {
        this.channelMode = ChannelDisplay.ChannelDisplayShowCellVolts;
    }

    showCellChart() {
        this.channelMode = ChannelDisplay.ChannelDisplayShowChart;
    }

    showChargingOptionsPage() {
        this.navCtrlr.push(ChargeOptionsPage, this.channel).then((v) => {
            console.log("Finished charger push");
        });
    }

    showMeasureIR() {
        this.channelMode = ChannelDisplay.ChannelDisplayShowIR;
    }

    showActionAlert() {
        let alert = this.actionController.create({
            'title': 'Channel ' + (this.index + 1),
            buttons: [
                {
                    text: 'Charge',
                    role: 'destructive',
                    handler: () => {
                        this.showChargingOptionsPage();
                    }
                },
                {
                    text: 'Store',
                    handler: () => {

                    }
                },
                {
                    text: 'Discharge',
                    handler: () => {

                    }
                },
                {
                    text: 'Balance Only',
                    handler: () => {

                    }
                },
                {
                    text: 'Measure IR',
                    handler: () => {
                        this.showMeasureIR();
                    }
                },
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: () => {
                    }
                }
            ]
        });

        alert.present()
    }

    startCharge() {

    }

    startDischarge() {

    }

    startBalance() {

    }

    startStore() {

    }

    measureIR() {

    }

    showChargerActions() {
        this.showActionAlert();
        // this.channelMode++;
        // if (this.channelMode > ChannelDisplay.ChannelDisplayShowOptions) {
        //     this.channelMode = ChannelDisplay.ChannelDisplayShowCellVolts;
        // }
        //
        // // Store the master height (the height of the cells).
        // // We want other panels to have this same height as a minimum
        // let elementById = document.getElementById("master");
        // if (elementById) {
        //     this.masterHeight = elementById.offsetHeight;
        // }
        //
        // console.log("Switch mode to ", this.channelMode);
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
            this.channelSubscription = this.channelObserver.subscribe((channelObject: Channel) => {
                    // Migrate the existing history to this new object
                    // Doing it this way so that the ng2 change detectors see a new instance,
                    // while migrating the long lived state from the old objects.
                    // I tried using a changeDetectorRef, but that didn't seem to work.
                    if (this.channel) {
                        channelObject.takeHistoryFrom(this.channel);
                    }
                    this.channel = channelObject;

                    if (this.channel) {
                        if (this.channelMode == ChannelDisplay.ChannelDisplayNothingPluggedIn) {
                            this.channelMode = ChannelDisplay.ChannelDisplayShowCellVolts;
                        }
                        // DEBUG:
                        if (this.firstTime && this.index == 0) {
                            this.firstTime = false;
                            // this.showMeasureIR();
                        }
                    }
                }
            );
        }
    }
}
