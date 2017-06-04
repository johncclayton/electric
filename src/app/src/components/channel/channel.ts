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

enum Operation {
    Charge = 0,
    Storage = 1,
    Discharge = 2,
    Cycle = 3,
    Balance = 4
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

    showOperationPage(title: string, operation: Operation, showCapacityAndC: boolean, charging: boolean, selectionCallback: (preset: Preset) => void) {
        this.navCtrlr.push(ChargeOptionsPage, {
            title: title,
            charging: charging,
            showCapacityAndC: showCapacityAndC,
            channel: this.channel,
            callback: selectionCallback
        });
    }

    showMeasureIR() {
        this.chargerService.measureIR(this.channel).subscribe((result) => {
            console.log("Measure IR done. Result: ", result);
        });
        this.channelMode = ChannelDisplay.ChannelDisplayShowIR;

        // Monitor the IR. When we see some amps for a short period of time, auto stop the operation
        this.channelObserver.takeWhile((channelObject) => {
            let less_than_one_amp = Math.abs(channelObject.curr_out_amps) < 1.0;
            console.log("At: ", channelObject.curr_out_amps, "ltoa: ", less_than_one_amp);
            return less_than_one_amp;
        }).subscribe((result) => {}, (error) => {}, () => {
            console.log("Stopping discharge because Measuer IR has seen some amps");
            this.stopCurrentTask();
        });

    }

    startOperation(preset: Preset, operation: Operation, named: string) {
        console.log("Begin ", named, " on channel ", this.channel.index, " using ", preset.name);
        let handler = (resp) => {
            console.log("Started ", named, " on channel " + this.channel.index + ", using preset: " + preset.name);
            console.log("Response: ", resp);
        };

        switch (operation) {
            case Operation.Charge:
                this.chargerService.startCharge(this.channel, preset).subscribe(handler);
                break;
            case Operation.Discharge:
                this.chargerService.startDischarge(this.channel, preset).subscribe(handler);
                break;
            case Operation.Storage:
                this.chargerService.startStore(this.channel, preset).subscribe(handler);
                break;
            case Operation.Balance:
                this.chargerService.startBalance(this.channel, preset).subscribe(handler);
                break;
            default:
                console.log("Um. Dunno what to do here, with operation ", operation, " named '", named, "'");
        }
    }

    startCharge(preset: Preset) {
        this.startOperation(preset, Operation.Charge, "Charge");
    }

    startDischarge(preset: Preset) {
        this.startOperation(preset, Operation.Discharge, "Discharge");
    }

    startStore(preset: Preset) {
        this.startOperation(preset, Operation.Storage, "Store");
    }

    startBalance(preset: Preset) {
        this.startOperation(preset, Operation.Balance, "Balance");
    }

    stopCurrentTask() {
        this.chargerService.stopCurrentTask(this.channel).subscribe((resp) => {
            console.log("Stopped!")
        });
    }

    showChargerActions() {
        if (!this.channel.packPluggedIn) {
            // console.debug("Channel json: ", this.channel.json);
            let toast = this.toastController.create({
                'message': "Pack not plugged in.",
                'cssClass': 'redToast',
                'position': 'bottom',
                'duration': 2000,
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
                            this.showOperationPage("Charge", Operation.Discharge, true, true, (preset => {
                                if (preset) {
                                    this.startCharge(preset);
                                }
                            }));
                        }
                    },
                    {
                        text: 'Store',
                        handler: () => {
                            this.showOperationPage("Store", Operation.Storage, false, true, (preset => {
                                if (preset) {
                                    this.startStore(preset);
                                }
                            }));
                        }
                    },
                    {
                        text: 'Discharge',
                        handler: () => {
                            this.showOperationPage("Discharge", Operation.Discharge, false, false, (preset => {
                                if (preset) {
                                    this.startDischarge(preset);
                                }
                            }));
                        }
                    },
                    {
                        text: 'Balance Only',
                        handler: () => {
                            this.showOperationPage("Balance", Operation.Balance, false, false, (preset => {
                                if (preset) {
                                    this.startBalance(preset);
                                }
                            }));
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
            this.unsubscribeFromChannel();
        }
    }

    unsubscribeFromChannel() {
        if (this.channelSubscription) {
            console.log("Channel ", this.channel.index, " going away, unsubscribing");
            this.channelSubscription.unsubscribe();
            this.channelSubscription = null;
        }
    }

    ngOnChanges(changes) {
        console.log("Channel is seeing change to bound data: ", changes);
        if (this.channelObserver) {
            this.unsubscribeFromChannel();
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
