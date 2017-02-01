import * as _ from "lodash";

export class Channel {
    _json = {};
    _index: number = 0;

    public constructor(index: number, jsonObject, configuredCellLimit: number = 0) {
        this._index = index;
        this._json = jsonObject;
        this.limitCellsBasedOnLimit(configuredCellLimit);

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

    get packPluggedIn(): boolean {
        let cells = this._json['battery_plugged_in'];
        let main = this._json['balance_leads_plugged_in'];
        return cells && main;
    }

    get isChargeRunning(): boolean {
        // 7 = charging
        // 13 = discharging
        // 17 = balance
        console.log("Charge run status is: ", this._json['run_status']);
        let run_states = [7, 13, 17];
        return run_states.indexOf(this._json['run_status']) != -1;
    }

    get isChargeStopped(): boolean {
        // 40 = finished charge, finished store
        let stopped_stats = [40, 0];
        return stopped_stats.indexOf(this._json['run_status']) != -1;
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


