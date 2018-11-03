import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {IChargerState} from '../../models/state/reducers/charger';
import {Observable, Subject, Subscription, timer} from 'rxjs';
import {iChargerService} from '../../services/icharger.service';
import {ActionSheetController, NavController, ToastController} from '@ionic/angular';
import {Preset} from '../../models/preset-class';
import {takeUntil, takeWhile} from 'rxjs/operators';
import {Channel} from '../../models/channel';
import {DataBagService} from '../../services/data-bag.service';
import {Router} from '@angular/router';

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
    templateUrl: './channel.component.html',
    styleUrls: ['./channel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelComponent implements OnInit, OnDestroy {
    public channelMode: number = ChannelDisplay.ChannelDisplayNothingPluggedIn;

    @Input() charger?: IChargerState;
    @Input() index: number;
    @Input() name: string;

    private firstTime: boolean;
    private measureIRObservable: Subscription;

    private ngUnsubscribe: Subject<void> = new Subject<void>();
    private currentOperationSubscription: Subscription = null;

    constructor(public chargerService: iChargerService,
                public navCtrlr: NavController,
                public router: Router,
                public dataBag: DataBagService,
                public toastController: ToastController,
                public actionController: ActionSheetController) {
        this.channelMode = ChannelDisplay.ChannelDisplayNothingPluggedIn;
        this.firstTime = true;
    }

    ngOnInit() {
    }

    getChannelMode() {
        return this.channelMode;
    }

    showCellVoltage() {
        this.channelMode = ChannelDisplay.ChannelDisplayShowCellVolts;
    }

    showOperationPage(title: string, showCapacityAndC: boolean, charging: boolean, selectionCallback: (preset: Preset) => void) {
        const pageData = {
            title: title,
            previousURL: this.router.url,
            charging: charging,
            showCapacityAndC: showCapacityAndC,
            channel: this.channel,
            callback: selectionCallback
        };

        // ChargingOptions will pull data from the bag
        this.dataBag.set('chargingOptions', pageData);

        this.navCtrlr.navigateForward('/ChargeOptions');
    }

    showMeasureIR() {
        this.chargerService.measureIR(this.channel)
            .pipe(
                takeUntil(this.ngUnsubscribe)
            ).subscribe((result) => {
            console.log('Measure IR done. Result: ', result);
        });
        this.channelMode = ChannelDisplay.ChannelDisplayShowIR;

        // Monitor the IR. When we see some amps for a short period of time, auto stop the operation
        this.measureIRObservable = timer(1000, 1000).pipe(
            takeWhile(() => {
                let less_than_one_amp = Math.abs(this.channel.output_amps) < 1.0;
                console.log('At: ', this.channel.output_amps, 'ltoa: ', less_than_one_amp);
                return less_than_one_amp;
            })).subscribe(() => {
        }, (error) => {
            console.error(`Error measuring IR: ${error}`);
            this.measureIRObservable.unsubscribe();
            this.measureIRObservable = null;
        }, () => {
            console.log('Stopping discharge because Measure IR has seen some amps');
            this.measureIRObservable.unsubscribe();
            this.measureIRObservable = null;
            this.stopCurrentTask();
        });
    }

    returnToShowingCellVolts(event) {
        // this.measureIRObservable == null means: if we're done with the measurement
        if (this.measureIRObservable == null) {
            event.stopPropagation();
            this.showCellVoltage();
        }
    }

    startOperation(preset: Preset, operation: Operation) {
        let operationPlan = this.operationPlanFor(preset, operation, this.channel);
        console.log('Begin ', operationPlan, ' on channel ', this.channel.index, ' using ', preset.name);

        if (this.currentOperationSubscription != null) {
            this.currentOperationSubscription.unsubscribe();
        }

        this.currentOperationSubscription = this.createOperation(preset, operation).subscribe((v) => {
            console.log('Started ', operationPlan, ' on channel ' + this.channel.index + ', using preset: ' + preset.name);
            console.log('Response: ', v.json());
        }, (error) => {
            console.error('Error doing ' + operationPlan + ', ' + error);
        }, () => {
            console.log('Operation ' + operationPlan + ' completed');
        });
    }

    createOperation(preset: Preset, operation: Operation): Observable<any> {
        let operationPlan = this.operationPlanFor(preset, Operation.Charge, this.channel);
        let named = this.stringForOperation(operation);
        this.channel.lastUserCommand = named;
        switch (operation) {
            case Operation.Charge:
                return this.chargerService.startCharge(this.channel, preset, operationPlan);
            case Operation.Discharge:
                return this.chargerService.startDischarge(this.channel, preset, operationPlan);
            case Operation.Storage:
                return this.chargerService.startStore(this.channel, preset, operationPlan);
            case Operation.Balance:
                return this.chargerService.startBalance(this.channel, preset, operationPlan);
            default:
                console.log('Um. Dunno what to do here, with operation ', operation, ' named \'', named, '\'');
        }
        return null;
    }

    // noinspection JSMethodCanBeStatic
    private stringForOperation(op: Operation): string {
        switch (op) {
            case Operation.Charge:
                return 'Charge';
            case Operation.Cycle:
                return 'Cycle';
            case Operation.Storage:
                return 'Storage';
            case Operation.Discharge:
                return 'Discharge';
            case Operation.Balance:
                return 'Balance';
        }
    }

    private operationPlanFor(preset: Preset, op: Operation, channel: Channel): string {
        return preset.charge_current + 'A ' + this.stringForOperation(op) + ' on channel ' + (channel.index + 1.0);
    }

    startCharge(preset: Preset) {
        this.startOperation(preset, Operation.Charge);
    }

    startDischarge(preset: Preset) {
        this.startOperation(preset, Operation.Discharge);
    }

    startStore(preset: Preset) {
        this.startOperation(preset, Operation.Storage);
    }

    startBalance(preset: Preset) {
        this.startOperation(preset, Operation.Balance);
    }

    stopCurrentTask() {
        this.channel.maybeClearLastUsedCommand(true);
        this.chargerService.stopCurrentTask(this.channel)
            .pipe(
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe(null, null, () => {
                    console.log('Stopped!');
                }
            );
    }

    async showChargerActions() {
        if (!this.channel.packConnected) {
            this.toastController.create({
                'message': 'Pack not plugged in.',
                'cssClass': 'warningToast',
                'position': 'bottom',
                'duration': 2000,
            }).then(toast => {
                toast.present();
            });
            return;
        }

        if (this.channel.lastActionResultedInError) {
            this.stopCurrentTask();
            this.channel.clearLastError();
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
                header: 'Channel ' + (this.index + 1),
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
            }).then(actionSheet => {
                actionSheet.present();
            });
        } else {
            let alert = this.actionController.create({
                'header': 'Channel ' + (this.index + 1),
                buttons: [
                    {
                        text: 'Charge',
                        role: 'destructive',
                        handler: () => {
                            this.showOperationPage('Charge', true, true, (preset => {
                                if (preset) {
                                    this.startCharge(preset);
                                }
                            }));
                        }
                    },
                    {
                        text: 'Store',
                        handler: () => {
                            this.showOperationPage('Store', false, true, (preset => {
                                if (preset) {
                                    this.startStore(preset);
                                }
                            }));
                        }
                    },
                    {
                        text: 'Discharge',
                        handler: () => {
                            this.showOperationPage('Discharge', false, false, (preset => {
                                if (preset) {
                                    this.startDischarge(preset);
                                }
                            }));
                        }
                    },
                    {
                        text: 'Balance Only',
                        handler: () => {
                            this.showOperationPage('Balance', false, false, (preset => {
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
            }).then(alert => {
                alert.present();
            });
        }

    }

    ngOnDestroy() {
        if (this.currentOperationSubscription != null) {
            this.currentOperationSubscription.unsubscribe();
        }
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    get channel(): Channel {
        return this.charger.channels[this.index];
    }

    ngOnChanges(changes) {
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

}
