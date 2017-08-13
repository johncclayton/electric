import {Action, Reducer} from "redux";
import {IConfig} from "./config";

export interface IStatus {
    cell_count: number;
    channel_count: number;
    device_id: number;
    device_sn: string;
    memory_len: number;
    software_ver: number;
    connected: boolean;
}

let defaultStatus: IStatus = {
    cell_count: 8,
    channel_count: 2,
    device_id: 0,
    device_sn: "",
    memory_len: 0,
    software_ver: 0,
    connected: false
};

export const
    statusReducer: Reducer<IStatus> = (state: IStatus, action: Action): IStatus => {
        return defaultStatus;
    };