import {environment} from '../../environments/environment';

export interface IChargerCaseFan {
    control: boolean;
    running: boolean;
    threshold: number;
    hysteresis: number;
    gpio: number;
}

export class System {
    public static CELSIUS: string = "°C";
    public static FARENHEIGHT: string = "°F";

    static unitsOfMeasure(celcius: boolean): string {
        if (celcius) {
            return System.CELSIUS;
        }
        return System.FARENHEIGHT;
    }

    constructor(private system_data: {}) {
        console.debug(`System object created. Data: ${JSON.stringify(this.system_data)}`);
        if (this.has_capabilities) {
            let keys = Object.keys(this.system_data['capabilities']);
            console.warn(`System Capabilities: ${keys.join(",")}. Env: ${System.environment.ionicEnvName}`);
        }
    }

    static get environment(): any {
        return environment;
    }

    static get isProduction(): boolean {
        return System.environment.ionicEnvName == 'prod';
    }

    static environmentStrings(): string[] {
        let callbackfn = (value): string => {
            return value + " = " + System.environment[value];
        };
        return Object.keys(System.environment).map(callbackfn);
    }

    clone(): System {
        let system: System = new System({});
        for (let k in this.system_data) {
            system.system_data[k] = this.system_data[k];
        }
        return system;
    }

    json() {
        // Exclude the 'capabilities' as these cannot be saved
        let copied_dict = {...this.system_data};
        if(this.has_capabilities) {
            delete copied_dict['capabilities'];
        }
        return JSON.stringify(copied_dict);
    }

    get data_structure() {
        return this.system_data;
    }

    get has_capabilities(): boolean {
        return 'capabilities' in this.system_data;
    }

    get has_case_fan() : boolean {
        return this.has_capability('case_fan')
    }

    public has_capability(capability_name: string): boolean {
        if (this.has_capabilities) {
            return capability_name in this.system_data['capabilities'];
        }
        return false;
    }

    get isCelsius(): boolean {
        return this.system_data['temp_unit'] == 'C';
    }

    set isCelsius(value: boolean) {
        this.system_data['temp_unit'] = value ? 'C' : 'F';
    }

    get temp_shutdown(): number {
        return this.system_data['temp_stop'];
    }

    set temp_shutdown(value: number) {
        this.system_data['temp_stop'] = +value;
    }

    get temp_power_reduce(): number {
        return -this.system_data['temp_reduce'] / 10.0;
    }

    set temp_power_reduce(value: number) {
        this.system_data['temp_reduce'] = value * -10.0;
    }

    get temp_fans_on(): number {
        return this.system_data['temp_fans_on'];
    }

    set temp_fans_on(value: number) {
        this.system_data['temp_fans_on'] = +value;
    }

    get fans_off_time(): number {
        return this.system_data['fans_off_delay'];
    }

    set fans_off_time(value: number) {
        this.system_data['fans_off_delay'] = +value;
    }

    get unitsOfMeasure(): string {
        if (this.isCelsius) {
            return "°C";
        }
        return "°F";
    }

    get brightness(): number {
        return this.system_data['lcd_brightness'];
    }

    set brightness(value: number) {
        this.system_data['lcd_brightness'] = +value;
    }

    get contrast(): number {
        return this.system_data['lcd_contrast'];
    }

    set contrast(value: number) {
        this.system_data['lcd_contrast'] = +value;
    }

}

