import {AnyAction, Reducer} from "redux";
import {ChargerActions} from "../actions/charger";
import {Channel} from "../../channel";
import {UIActions} from "../actions/ui";

export interface IChargerState {
    charger_presence: string;
    cell_count: number;
    channel_count: number;
    device_id: number;
    device_sn: string;
    memory_len: number;
    software_ver: number;

    channels: Array<Channel>;

    // Synthetic state, summed from the channels
    total_output_amps: number;
    total_capacity: number;
    input_volts: number;
    charger_temp: number;
}

let defaultStatus: IChargerState = {
    charger_presence: "unknown",
    cell_count: 8,
    channel_count: 2,
    device_id: 0,
    device_sn: "",
    memory_len: 0,
    software_ver: 0,
    channels: [],

    // Synthetic state, summed from the channels
    total_output_amps: 0,
    total_capacity: 0,
    input_volts: 0,
    charger_temp: 0
};

export const
    chargerStateReducer: Reducer<IChargerState> = (state: IChargerState, action: AnyAction): IChargerState => {
        if (state == null) {
            return defaultStatus;
        }
        switch (action.type) {
            case ChargerActions.SET_LAST_ERROR:
                return {
                    ...state,
                    channels: state.channels.map((ch) => {
                        if (ch.index == action.index) {
                            // OK. Modify THIS one.
                            let newCh: Channel = Channel.newMergeFromOld(ch);
                            newCh.setLastActionError(action.payload);
                            return newCh;
                        }
                        return ch;
                    })
                };

            case ChargerActions.UPDATE_STATE_FROM_CHARGER:
                let unifiedStatus = action.payload;

                let newState: IChargerState = {
                    ...state,
                    ...unifiedStatus['status']
                };

                // Synthetic.
                newState.channel_count = 0;

                // "sum" the channel state :)
                newState.total_output_amps = 0;
                newState.total_capacity = 0;
                newState.input_volts = 0;
                newState.charger_temp = 0;

                let channels = [];

                if ('channels' in unifiedStatus) {
                    unifiedStatus.channels.map((json, index) => {
                        let have_existing_state_for_channel: boolean = state.channels.length > index;
                        let oldJson = have_existing_state_for_channel ? state.channels[index].json : {};

                        // Create a new channel that contains old + new state
                        // Note: transient state from the old channel won't be taken over
                        let newChannel: Channel = new Channel(index, {...oldJson, ...json}, action.cellLimit);

                        // If we do have an old channel, migrate the transient state
                        // Mainly because I'm storing state IN The channel object (because I want it to be local for some reason)
                        // Hmm.
                        if (have_existing_state_for_channel) {
                            let oldChannel = state.channels[index];
                            if (oldChannel) {
                                newChannel.migrateTransientState(oldChannel);
                                newChannel.updateTransientState(newState.device_id, oldChannel);
                            }
                        }

                        channels.push(newChannel);

                        newState.total_output_amps += newChannel.output_amps;
                        newState.total_capacity += newChannel.output_capacity;

                        // Copy the volts + temp
                        if (index == 0) {
                            newState.input_volts = newChannel.input_volts;
                            newState.charger_temp = newChannel.charger_internal_temp;
                        }
                    });
                    newState.channel_count = channels.length;
                }
                newState.channels = channels;
                return newState;
        }
        return state;
    };