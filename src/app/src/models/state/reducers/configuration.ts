import {AnyAction, Reducer} from "redux";
import {ConfigurationActions} from "../actions/configuration";

export interface IChargeSettings {
    wantedChargeRateInC: number,
    capacity: number,
    numPacks: number,
    chemistryFilter: string,
    chargeMethod: string

    // Synthetics
    channelLimitReached: boolean;
    ampsForWantedChargeRate: number;
    safeAmpsForWantedChargeRate: number;
}

export interface IConfig {
    ipAddress: string,
    port: number,
    isnew: boolean,
    cellLimit: number,
    preventChargerVerticalScrolling: boolean,
    mockCharger: boolean,

    charge_settings: IChargeSettings;
}

const chargerDefaults: IChargeSettings = {
    wantedChargeRateInC: 1,
    capacity: 2000,
    numPacks: 4,
    chemistryFilter: "All",
    chargeMethod: "presets",

    // Synthetics
    channelLimitReached: false,
    ampsForWantedChargeRate: 0,
    safeAmpsForWantedChargeRate: 0
};

export const configurationDefaults: IConfig = {
    ipAddress: "localhost",
    port: 5000,
    isnew: true,
    cellLimit: -1,
    preventChargerVerticalScrolling: true,
    mockCharger: false,

    charge_settings: chargerDefaults
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

            case ConfigurationActions.UPDATE_CHARGE_CONFIG_KEYVALUE:
                if (action.payload) {
                    let maxAmpsPerChannel = action.maxAmpsPerChannel;
                    let new_charge_settings: IChargeSettings = {
                        ...state.charge_settings,
                        ...action.payload
                    };

                    new_charge_settings.ampsForWantedChargeRate = new_charge_settings.numPacks * (new_charge_settings.capacity / 1000) * new_charge_settings.wantedChargeRateInC;
                    new_charge_settings.safeAmpsForWantedChargeRate = Math.min(new_charge_settings.ampsForWantedChargeRate, maxAmpsPerChannel);
                    new_charge_settings.channelLimitReached = new_charge_settings.ampsForWantedChargeRate > maxAmpsPerChannel;

                    return {
                        ...state,
                        ...{charge_settings: new_charge_settings}
                    }
                }
                return state;

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