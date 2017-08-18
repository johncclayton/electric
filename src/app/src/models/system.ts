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

    get temp_shutdown(): number {
        return this.data['temp_stop'];
    }

    set temp_shutdown(value: number) {
        this.data['temp_stop'] = +value;
    }

    get temp_power_reduce(): number {
        return -this.data['temp_reduce'] / 10.0;
    }

    set temp_power_reduce(value: number) {
        this.data['temp_reduce'] = value * -10.0;
    }

    get temp_fans_on(): number {
        return this.data['temp_fans_on'];
    }

    set temp_fans_on(value: number) {
        this.data['temp_fans_on'] = +value;
    }

    get fans_off_time(): number {
        return this.data['fans_off_delay'];
    }

    set fans_off_time(value: number) {
        this.data['fans_off_delay'] = +value;
    }

    get unitsOfMeasure(): string {
        if (this.isCelsius) {
            return "°C";
        }
        return "°F";

    }
}

