export class System {
    data: {} = {};

    constructor(public dict: {}) {
        this.data = dict;
    }

    json() {
        return JSON.stringify(this.data);
    }

    get isCelsius(): boolean {
        return this.data['temp_unit'] == 'C';
    }

    set isCelsius(value: boolean) {
        this.data['temp_unit'] = value ? 'C' : 'F';
    }
}

