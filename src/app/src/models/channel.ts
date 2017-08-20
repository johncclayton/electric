/**

 DeviceInfo.run_status
 1 = stopped (showing stopped)
 5 = start
 6 = check
 7 = charging (I see: start, check, charge)
 14,11,12,7/13 = storage (start, check, charge/discharge)
 13 = discharging
 17 = balance
 40 = done, beeping.
 0 = idle, doing nothing

 Storage & Discharge (as DISCHG):
 - run_state=13
 - control_state=3
 - -ve current_out_capacity
 - -ve current_out_amps
 - -ve current_out_power

 Storage (CHARGE)
 - run_state=7
 - control_state=2
 - +ve current_out_capacity
 - +ve current_out_amps
 - +ve current_out_power

 Run_status possible bit field:
 1/1 : active (stopped, charging, discharge, anything other than idle)
 2/2 : check
 3/4 : start
 4/8 : charge
 5/16:
 6/32:
 7/64:

 Control_status
 0 = stopped
 2 = b.cv
 3 = b.cc
 */
import {ChargerType, iChargerService} from "../services/icharger.service";

export class Channel {
    _json = {};
    _index: number = 0;
    _cellLimit: number = 0;
    _lastUserInitiatedCommand: string = null;
    _timeUserSetLastInitiatedCommand: number;
    _timeUserInitiatedCommandTimeout: number = 5;

    private packPluggedIn: boolean;
    private requiresCellStablization: boolean = false;
    private _lastActionResultedInError: boolean = false;
    private _lastErrorText: string = "";
    private noCellChangesCount: number = 0;
    private lastActionText: string;

    public constructor(index: number, jsonObject, configuredCellLimit: number = 0) {
        this._index = index;
        this._json = jsonObject;
        this._cellLimit = configuredCellLimit;
        this.limitCellsBasedOnLimit(configuredCellLimit);

        /*
         Migrate all the properties of the object directly onto this object, so they can be easily accessed
         */
        for (let key of Object.keys(jsonObject)) {
            Object.defineProperty(this, key, {
                get: () => {
                    return this._json[key];
                },
                set: (value) => {
                    this._json[key] = value;
                }
            });
        }
    }

    updateStateFrom(jsonResponse: any | string, cellLimit: any) {
        this._json = jsonResponse;
        this.limitCellsBasedOnLimit(cellLimit);
    }

    set lastUserInitiatedCommand(value: string) {
        this._lastUserInitiatedCommand = value;
        this._timeUserSetLastInitiatedCommand = Date.now();
    }

    get index(): number {
        return this._index;
    }

    public get numberOfCells(): number {
        return this.cells.length;
    }

    get cells() {
        return this._json['cells'];
    }

    get json() {
        return this._json;
    }

    get cell_count_with_voltage_values(): number {
        return this._json['cell_count_with_voltage_values'];
    }

    get input_volts(): number {
        return this._json['curr_inp_volts'];
    }

    get output_amps(): number {
        return this._json['curr_out_amps'];
    }

    get output_capacity(): number {
        return this._json['curr_out_capacity'];
    }

    get charger_internal_temp(): number {
        return this._json['curr_int_temp'];
    }

    get hasUserInitiatedCommandText(): boolean {
        if (!this.packConnected) {
            return false;
        }
        if (!this.packBalanceLeadsConnected) {
            return false;
        }
        let b = this._lastUserInitiatedCommand != null;
        // console.log("Has last command: ", b);
        return b;
    }

    get userCommandText(): string {
        return this._lastUserInitiatedCommand;
    }

    setLastActionError(message: string) {
        this._lastActionResultedInError = true;
        this._lastErrorText = message;
    }

    clearLastError() {
        this._lastActionResultedInError = false;
        this._lastErrorText = null;
    }

    get lastActionResultedInError(): boolean {
        return this._lastActionResultedInError;
    }

    /*
     run_state: shows what the charger is doing: checking, charging, discharging, starting, stopped, etc.
     control_state: not really sure. It might mean "I am controlling something (like volts, current)", but I havn't found a pattern just yet.

     Unfortunately, there's no var I can see that tells us the current operation (storage, balance, etc).
     e.g: when doing Storage, you charge or discharge. run_state gives us charge/discharge, but doesn't say
     if that's a result of us performing an actual Charge operation, or a Storage operation.
     */
    get actionText(): string {
        if (this._lastActionResultedInError && this._lastErrorText) {
            return this._lastErrorText;
        }
        if (this.requiresCellStablization) {
            return this.lastActionText;
        }
        this.lastActionText = this.actionBasedOnState();
        return this.lastActionText;
    }

    private actionBasedOnState(): string {
        let run_state = this.runState;

        if (!this.packConnected) {
            this.maybeClearLastUsedCommand(true);
            return "No pack";
        }
        // if (!this.packBalanceLeadsConnected) {
        //     this.maybeClearLastUsedCommand(true);
        //     return "Balance leads?";
        // }

        let text: string = "";

        if (run_state == 5) {
            text += "Start";
        } else if (run_state == 6 || run_state == 12) {
            text += "Check";
        } else if (run_state == 7) {
            text += "Charging";
        } else if (run_state == 13) {
            text += "Discharge";
        } else if (run_state == 17) {
            text += "Balancing";
        } else if (run_state == 1) {
            text += "Stopped";
        } else if (run_state == 40) {
            text += "DONE";
        } else {
            this.maybeClearLastUsedCommand(false);
            text += "Idle";
        }

        return text;
    }

    public set lastUserCommand(command: string) {
        this._lastUserInitiatedCommand = command;
        this._timeUserInitiatedCommandTimeout = Date.now();
    }

    public maybeClearLastUsedCommand(force: boolean) {
        if (this.index == 0 && force) {
            // console.log("maybeClearLastUsedCommand called: force:", force);
        }
        if (force) {
            if (this._lastUserInitiatedCommand != null) {
                this._lastUserInitiatedCommand = null;
                this._timeUserSetLastInitiatedCommand = null;
            }
            return;
        }
        if (this._timeUserSetLastInitiatedCommand) {
            let rightNow = Date.now();
            let elapsedTime: number = rightNow - this._timeUserSetLastInitiatedCommand;
            if (elapsedTime > this._timeUserInitiatedCommandTimeout) {
                this._lastUserInitiatedCommand = null;
                this._timeUserSetLastInitiatedCommand = null;
                console.log("Last user task cleared due to timeout");
            }
        }
    }

    packPluggedInBasic(device_id): boolean {
        let max_voltage = iChargerService.lookupChargerMetadata(device_id, 'maxVolts', 0);
        if (max_voltage > 0) {
            return this.curr_out_volts <= max_voltage;
        }
        return false;
    }

    public migrateTransientState(oldChannel: Channel) {
        this._lastActionResultedInError = oldChannel._lastActionResultedInError;
        this._lastErrorText = oldChannel._lastErrorText;

        this.noCellChangesCount = oldChannel.noCellChangesCount;
        this.requiresCellStablization = oldChannel.requiresCellStablization;
        this.lastActionText = oldChannel.lastActionText;
    }

    public updateTransientState(device_id, oldChannel: Channel) {
        let old_plugged_in: boolean = oldChannel.packPluggedInBasic(device_id);
        let plugged_in: boolean = this.packPluggedInBasic(device_id);

        // If we think the pack is plugged in... check more thoroughly.
        // If we see a change in number of cells connected, this change must stabilize before we can take any action
        let change_to_basic_state = old_plugged_in != plugged_in;
        let change_to_number_of_cells = this.numberOfActiveCells != oldChannel.numberOfActiveCells;

        if (change_to_number_of_cells || change_to_basic_state) {
            this.requiresCellStablization = true;
            this.noCellChangesCount = 0;
        }

        // When stabilizing, increment noCellChangesCount continuously while the cell count remains ... stable!
        if (this.requiresCellStablization) {
            this.noCellChangesCount++;

            // If we've seen no change to the active number of cells, in N cycles
            if (this.noCellChangesCount > 1) {
                this.requiresCellStablization = false;
            }
        }

        // No change to active cell count, and no need to stablize.
        // We can check for cell's using cell volts & balance volts
        if (!this.requiresCellStablization) {
            if (this.cell_count_with_voltage_values > 0) {
                let diff: number = Math.abs(100.0 - ((this.curr_out_volts / this.cell_total_voltage) * 100.0))
                if (diff < 3) {
                    plugged_in = true;
                }
            }
        }

        this.packPluggedIn = plugged_in;
        return plugged_in;
    }

    get packAndBalanceConnected(): boolean {
        return this.packConnected && this.packBalanceLeadsConnected;
    }

    get curr_out_volts(): number {
        return this._json['curr_out_volts'];
    }

    get cell_total_voltage(): number {
        return this._json['cell_total_voltage'];
    }

    get channel_volts(): number {
        if (!this.packConnected) {
            return 0.0;
        }
        return this.curr_out_volts;
    }

    get packConnected(): boolean {
        return this.packPluggedIn;
    }

    get packBalanceLeadsConnected(): boolean {
        return this._json['balance_leads_plugged_in'];
    }

    get isChargeRunning(): boolean {
        // 7 = charging
        // 13 = discharging
        // 17 = balance
        // 41 = stopped? Or in error?
        console.log("Charge run status is: ", this._json['run_status']);
        let run_states = [7, 13, 17, 41];
        return run_states.indexOf(this.runState) != -1;
    }

    get isChargeStopped(): boolean {
        // 40 = finished charge, finished store
        let stopped_stats = [40, 0];
        return stopped_stats.indexOf(this.runState) != -1;
    }

    get runState(): number {
        return this._json['run_status'];
    }

    get controlState(): number {
        return this._json['control_status'];
    }

    get maxMilliVoltDiff() {
        let cells = this.cells;
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
        return (maximum - minimum) * 1000.0;
    }

    private limitCellsBasedOnLimit(configuredCellLimit: number) {
        // Limit the number of cells
        if (configuredCellLimit >= 0) {
            let activeCells = this.numberOfActiveCells;
            if (activeCells != this._json['cells'].length) {
                // console.debug(`Limited cells on channel ${this._index} to ${activeCells}`);
                let toShow = Math.max(activeCells, configuredCellLimit);
                if (activeCells || configuredCellLimit) {
                    // If the number of cells we see is greater than our limit, we need to +1, else the slice will be 'one short'.
                    if (activeCells > configuredCellLimit) {
                        toShow++;
                    }
                    this._json['cells'] = this._json['cells'].slice(0, toShow);
                }
            }
        }
    }

    private get numberOfActiveCells() {
        // Maybe reduce the channels, as long as they are 0 volt.
        let cells = this._json['cells'];
        if (cells) {
            // Check voltages.
            // If we see a voltage on a channel, we must show everything up to that channel for safety
            let voltageSeenAtIndex = 0;
            cells.forEach((item, index) => {
                if (item.v > 0) {
                    voltageSeenAtIndex = index;
                }
            });
            return voltageSeenAtIndex;
        }
        return 0;
    }

    static newMergeFromOld(ch: Channel) {
        let state = {};
        for (let k in ch._json) {
            state[k] = ch._json[k]
        }
        let c = new Channel(ch.index, state, ch._cellLimit);
        c.migrateTransientState(ch);
        return c;
    }
}


