import {Component, Input, trigger, state, style, transition, animate} from "@angular/core";
import {iChargerService} from "../../services/icharger.service";
import {Channel} from "../../models/channel";
import {ActionSheetController, NavController, AlertController, ToastController} from "ionic-angular";
import {ChargeOptionsPage} from "../../pages/charge-options/charge-options";
import {Preset} from "../../pages/preset/preset-class";

enum ChannelDisplay {
    ChannelDisplayNothingPluggedIn,
    ChannelDisplayShowCellVolts,
    ChannelDisplayShowIR,
}

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
                public alertController: AlertController,
                public toastController: ToastController,
                public actionController: ActionSheetController) {
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

    showChargingOptionsPage() {
        this.navCtrlr.push(ChargeOptionsPage, {
            channel: this.channel,
            callback: (preset) => {
                if (preset) {
                    this.startCharge(preset);
                }
            }
        });
    }

    showMeasureIR() {
        this.channelMode = ChannelDisplay.ChannelDisplayShowIR;
    }

    startCharge(preset: Preset) {
        console.log("Begin charge on channel ", this.channel.index, " using ", preset.name);
        this.chargerService.startCharge(this.channel, preset).subscribe((resp) => {
            console.log("Started a charge on channel " + this.channel.index + ", using preset: " + preset.name);
            console.log("Start response: ", resp);
        });
    }

    startDischarge() {
        // this.chargerService.startDischarge(this.channel);
    }

    startBalance() {
        // this.chargerService.startBalance(this.channel);
    }

    startStore() {
        // this.chargerService.startStore(this.channel);
    }

    measureIR() {
        // this.chargerService.measureIR(this.channel);
    }

    stopCurrentTask() {
        this.chargerService.stopCurrentTask(this.channel).subscribe((resp) => {
            console.log("Stopped!")
        });
    }

    showChargerActions() {
        if (!this.channel.packPluggedIn) {
            let toast = this.toastController.create({
                'message': "Pack not plugged in.",
                'cssClass': 'redToast',
                'position': 'bottom',
                'duration' : 2000,
            });
            toast.present();
            return;
        }

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

        if (this.channel.isChargeRunning) {
            let alert = this.actionController.create({
                'title': 'Channel ' + (this.index + 1),
                buttons: [
                    {
                        text: 'Stop',
                        role: 'destructive',
                        handler: () => {
                            this.stopCurrentTask();
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
            alert.present();
        } else {
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
                            this.startStore();
                        }
                    },
                    {
                        text: 'Discharge',
                        handler: () => {
                            this.startDischarge();
                        }
                    },
                    {
                        text: 'Balance Only',
                        handler: () => {
                            this.startBalance();
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
            });
        }
    }
}
