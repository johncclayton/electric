export class Channel {
    _json = {};
    _index: number = 0;
    _cellHistory: {} = {};

    public constructor(index: number, jsonObject, configuredCellLimit: number = 0) {
        this._index = index;
        this._json = jsonObject;
        this._cellHistory = {};
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

    // Thus number of cells we can see voltage > 0 on.
    get numberOfActiveCells(): number {
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

    get cells() {
        return this._json['cells'];
    }

    get json() {
        return this._json;
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

    /*
     Stores the cell history for this channel.
     If the number of cells changes, it is cleared automatically.
     */
    addToStoredHistory() {
        let cells = this.cells;
        if (cells) {
            let isEmpty = Object.keys(this._cellHistory).length == 0;
            let isChanged = false;
            if (!isEmpty) {
                isChanged = cells.length != this._cellHistory['cellCount'];
            }
            if (isEmpty || isChanged) {
                console.log(`Empty: ${isEmpty}, Changed: ${isChanged}. Clearing history for channel ${this.index}, cell count changed from ${this._cellHistory['cellCount']}  to ${cells.length}`);
                this._cellHistory = {
                    cellCount: cells.length,
                    history: []
                };
            }

            cells.forEach((cell, index) => {
                let series = this._cellHistory['history'][index];
                if (!series) {
                    this._cellHistory['history'][index] = [];
                } else {
                    series.push(cell);
                }
            });
        }
    }

    clearHistory() {
        console.log("Clearing cell history");
        this._cellHistory = {};
    }

    history() {
        return this._cellHistory['history'];
    }

    takeHistoryFrom(channelObject: Channel) {
        this._cellHistory = channelObject._cellHistory;
    }
}


