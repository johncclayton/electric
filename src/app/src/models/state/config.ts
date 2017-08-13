import {Action, AnyAction, Reducer} from "redux";
import {ConfigurationActions} from "./charger";

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

const chargerDefaults: IChargeSettings = {
    capacity: 2000,
    c: 2,
    numPacks: 4,
    chemistryFilter: "All",
    chargeMethod: "presets"
};

export const configurationDefaults: IConfig = {
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
    configReducer: Reducer<IConfig> = (state: IConfig, action: AnyAction): IConfig => {
        switch(action.type) {
            case ConfigurationActions.RESET_TO_DEFAULTS:
                return configurationDefaults;

            case ConfigurationActions.SET_CONFIGURATION:
                return {
                    ...state,
                    ...action.payload
                }
        }

        return configurationDefaults;
    };