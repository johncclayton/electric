import {AnyAction, Reducer} from "redux";
import {ConfigurationActions} from "../actions/configuration";

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
    ipAddress: "localhost",
    port: 5000,
    isnew: true,
    cellLimit: -1,
    preventChargerVerticalScrolling: true,
    unitsCelsius: true,
    mockCharger: false,
    charge: chargerDefaults
};


export const
    configReducer: Reducer<IConfig> = (state: IConfig = configurationDefaults, action: AnyAction): IConfig => {
        switch (action.type) {
            case ConfigurationActions.SET_FULL_CONFIG:
                if (action.payload) {
                    return action.payload;
                } else {
                    return state;
                }

            case ConfigurationActions.RESET_TO_DEFAULTS:
                return configurationDefaults;

            case ConfigurationActions.UPDATE_CONFIG_KEYVALUE:
                if (action.payload) {
                    return {
                        ...state,
                        ...action.payload
                    }
                }
                return state;
        }

        return state;
    };