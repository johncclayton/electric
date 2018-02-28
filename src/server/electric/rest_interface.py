import logging

from flask import request
from flask_restful import Resource

from zmq_marshall import ZMQCommsManager
from electric.models import Operation, CaseFan
from electric.models import ObjectNotFoundException, SystemStorage, Preset, PresetIndex

logger = logging.getLogger('electric.app.{0}'.format(__name__))
comms = ZMQCommsManager()

RETRY_LIMIT = 1


def connection_state_dict(exc=None):
    """
    Returns a dict that wraps up the information provided by the exception as well as
    the connection state of the charger
    """

    state = "connected"
    if exc is not None and isinstance(exc, Exception):
        state = "disconnected"

    value = {
        "charger_presence": state
    }

    if exc is not None:
        value.update({"exception": str(exc)})

    return value


class PushTokenResource(Resource):
    def put(self, token):
        # TODO: add the token to the push database
        pass

    def delete(self, token):
        # TODO: remove the token from the push database
        pass


class StatusResource(Resource):
    def get(self):
        info = comms.get_device_info()

        obj = info.to_primitive()
        obj.update(connection_state_dict())

        return obj


class UnifiedResource(Resource):
    def get(self):
        device_info = comms.get_device_info()
        case_fan_info = comms.get_case_fan_info()

        obj = {}
        obj.update(connection_state_dict())
        obj['status'] = device_info.to_primitive()
        obj['case_fan_info'] = case_fan_info.to_primitive()

        # Yeh, very meh. These are currently serialized by DeviceInfo.
        # I want to (for now) keep them for /status, but I don't want them in my /unified response.
        # becauuuuuse, they are within the channel response (see below)
        del obj['status']['ch1_status']
        del obj['status']['ch2_status']

        for index, channel in enumerate(range(0, device_info.channel_count)):
            channel_status = comms.get_channel_status(channel)
            if channel_status:
                if not obj.get('channels'):
                    obj['channels'] = []

                # Steal the ch_status objects and put them into each channels "response".
                if device_info is not None:
                    if index == 0:
                        channel_status.status = device_info.ch1_status
                    elif index == 1:
                        channel_status.status = device_info.ch2_status

                obj['channels'].append(channel_status.to_primitive())

        return obj


class DialogCloseResource(Resource):
    def put(self, channel_id):
        channel = int(channel_id)
        if not (channel == 0 or channel == 1):
            return connection_state_dict("Channel number must be 0 or 1"), 403
        # comms.close_messagebox(channel)

        obj = comms.get_channel_status(channel).to_primitive()
        obj.update(connection_state_dict())

        return obj


class ZMQCommsResource(Resource):
    def put(self):
        comms.close_and_reopen_connection()
        return {}


class ChannelResource(Resource):
    def get(self, channel_id):
        try:
            channel = int(channel_id)
            if not (channel == 0 or channel == 1):
                return connection_state_dict("Channel number must be 0 or 1"), 403

            # get device status, so we know more about channel state
            device_info = comms.get_device_info()
            status = comms.get_channel_status(channel)
            if status is not None:
                if device_info is not None:
                    if channel == 0:
                        status.status = device_info.ch1_status
                    elif channel == 1:
                        status.status = device_info.ch2_status

                obj = status.to_primitive()
                obj.update(connection_state_dict())

                return obj

            return connection_state_dict("No status object returned from get_channel_status call"), 403
        except Exception, e:
            raise e


class ControlRegisterResource(Resource):
    def get(self):
        control = comms.get_control_register()

        # note: intentionally no connection state
        return control.to_primitive()


class ChargeResource(ControlRegisterResource):
    def put(self, channel_id, preset_memory_slot):
        device_status = comms.run_operation(Operation.Charge, int(channel_id), int(preset_memory_slot))
        comms.turn_off_logging()
        annotated_device_status = device_status.to_primitive()
        annotated_device_status.update(connection_state_dict())
        return annotated_device_status


class DischargeResource(ControlRegisterResource):
    def put(self, channel_id, preset_memory_slot):
        device_status = comms.run_operation(Operation.Discharge, int(channel_id), int(preset_memory_slot))
        annotated_device_status = device_status.to_primitive()
        annotated_device_status.update(connection_state_dict())
        return annotated_device_status


class StoreResource(ControlRegisterResource):
    def put(self, channel_id, preset_memory_slot):
        device_status = comms.run_operation(Operation.Storage, int(channel_id), int(preset_memory_slot))
        annotated_device_status = device_status.to_primitive()
        annotated_device_status.update(connection_state_dict())
        return annotated_device_status


class BalanceResource(ControlRegisterResource):
    def put(self, channel_id, preset_memory_slot):
        device_status = comms.run_operation(Operation.Balance, int(channel_id), int(preset_memory_slot))
        annotated_device_status = device_status.to_primitive()
        annotated_device_status.update(connection_state_dict())
        return annotated_device_status


class MeasureIRResource(ControlRegisterResource):
    def put(self, channel_id):
        device_status = comms.measure_ir(int(channel_id))
        annotated_device_status = device_status.to_primitive()
        annotated_device_status.update(connection_state_dict())
        return annotated_device_status


class StopResource(ControlRegisterResource):
    def put(self, channel_id):
        channel_number = int(channel_id)
        # We do this twice. Once to stop. 2nd time to get past the "STOPS" screen.
        operation_response = comms.stop_operation(channel_number).to_primitive()
        operation_response = comms.stop_operation(channel_number).to_primitive()
        operation_response.update(connection_state_dict())
        return operation_response


class SystemStorageResource(Resource):
    def get(self):
        syst = comms.get_system_storage()
        obj = syst.to_primitive()
        obj.update(connection_state_dict())
        capabilities = {
            'case_fan': True
        }
        obj['capabilities'] = capabilities

        return obj

    def put(self):
        json_dict = request.json
        del json_dict['charger_presence']
        system_storage_object = SystemStorage(json_dict)
        return comms.save_system_storage(system_storage_object)


class PresetResource(Resource):
    def get(self, preset_memory_slot):
        preset_memory_slot = int(preset_memory_slot)
        preset = comms.get_preset(preset_memory_slot)
        return preset.to_primitive()

    def delete(self, preset_memory_slot):
        # This will only, I think ... work for "at the end"
        preset_memory_slot = int(preset_memory_slot)
        logger.info("Try to delete preset at memory slot {0}".format(preset_memory_slot))
        return comms.delete_preset_at_index(preset_memory_slot)

    def put(self, preset_memory_slot):
        preset_memory_slot = int(preset_memory_slot)
        json_dict = request.json

        # Turn it into a Preset object
        preset = Preset(json_dict)

        logger.info("Asked to save preset to mem slot: {0} with {1}".format(preset_memory_slot, json_dict))
        return comms.save_preset_to_memory_slot(preset, preset_memory_slot)


class AddNewPresetResource(Resource):
    def put(self):
        json_dict = request.json

        # Turn it into a Preset object
        preset = Preset(json_dict)

        logger.info("Asked to add a new preset: {0}".format(json_dict))
        return comms.add_new_preset(preset).to_native()


class PresetListResource(Resource):
    def get(self):
        preset_list = comms.get_full_preset_list()
        # TODO: Error handling

        all_presets = []
        for index in preset_list.range_of_presets():
            # Preset.index is the memory slot it's in, not the position within the index
            memory_slot_number = preset_list.indexes[index]
            preset = comms.get_preset(memory_slot_number)
            if preset.is_used or preset.is_fixed:
                try:
                    native = preset.to_native()
                    all_presets.append(native)
                except Exception, e:
                    logger.info("BOOM: " + e)

        return all_presets

    def post(self):
        pass


class PresetOrderResource(Resource):
    def get(self):
        preset_list = comms.get_full_preset_list()
        return preset_list.to_native()

    def post(self):
        json_dict = request.json
        preset_list = PresetIndex(json_dict)
        return comms.save_full_preset_list(preset_list)


class CaseFanResource(Resource):
    def get(self):
        case_fan_object = comms.get_case_fan_info()
        return case_fan_object.to_native()

    def put(self):
        json_dict = request.json
        case_fan = CaseFan(json_dict)
        return comms.set_case_fan_prefs(case_fan).to_native()
