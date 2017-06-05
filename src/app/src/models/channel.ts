/*

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

export class Channel {
    _json = {};
    _index: number = 0;

    public constructor(index: number, jsonObject, configuredCellLimit: number = 0) {
        this._index = index;
        this._json = jsonObject;
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

    get charger_internal_temp(): number {
        return this._json['curr_int_temp'];
    }

    /*
     run_state: shows what the charger is doing: checking, charging, discharging, starting, stopped, etc.
     control_state: not really sure. It might mean "I am controlling something (like volts, current)", but I havn't found a pattern just yet.

     Unfortunately, there's no var I can see that tells us the current operation (storage, balance, etc).
     e.g: when doing Storage, you charge or discharge. run_state gives us charge/discharge, but doesn't say
     if that's a result of us performing an actual Charge operation, or a Storage operation.
     */
    get headingText(): string {
        let run_state = this.runState;
        // let control_state = this.controlState;

        if (!this.packConnected) {
            return "No pack";
        }
        if (!this.packBalanceLeadsConnected) {
            return "Balance leads?";
        }

        if (run_state == 5) {
            return "Start";
        }
        if (run_state == 6 || run_state == 12) {
            return "Check";
        }
        if (run_state == 7) {
            return "Charging";
        }
        if (run_state == 13) {
            return "Discharge";
        }
        if (run_state == 17) {
            return "Balancing";
        }
        if (run_state == 1) {
            return "Stopped";
        }
        if (run_state == 40) {
            return "DONE";
        }
        return "Idle";
    }

    get packAndBalanceConnected(): boolean {
        return this.packConnected && this.packBalanceLeadsConnected;
    }

    get packConnected(): boolean {
        return this._json['battery_plugged_in'];
    }

    get packBalanceLeadsConnected(): boolean {
        return this._json['balance_leads_plugged_in'];
    }

    get isChargeRunning(): boolean {
        // 7 = charging
        // 13 = discharging
        // 17 = balance
        console.log("Charge run status is: ", this._json['run_status']);
        let run_states = [7, 13, 17];
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

}


