export class System {
    constructor(private data: {}) {
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

