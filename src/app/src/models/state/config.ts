import {Action, Reducer} from "redux";

export interface IChargeSettings {
    capacity: number,
    c: number,
    numPacks: number,
    chemistryFilter: string,
    chargeMethod: string
}

export interface IConfig {
    ipAddress: string,
    port: number,
    isnew: boolean,
    cellLimit: number,
    preventChargerVerticalScrolling: boolean,
    unitsCelsius: boolean,
    mockCharger: boolean,
    charge: IChargeSettings;
}

let chargerDefaults: IChargeSettings = {
    capacity: 2000,
    c: 2,
    numPacks: 4,
    chemistryFilter: "All",
    chargeMethod: "presets"
};

export let configurationDefaults: IConfig = {
    ipAddress: "localhost-ish",
    port: 5002,
    isnew: true,
    cellLimit: -1,
    preventChargerVerticalScrolling: true,
    unitsCelsius: true,
    mockCharger: false,
    charge: chargerDefaults
};


export const
    configReducer: Reducer<IConfig> = (state: IConfig, action: Action): IConfig => {
        return configurationDefaults;
    };