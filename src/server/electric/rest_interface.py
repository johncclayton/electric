import os

from flask_restful import Resource

from icharger.comms_layer import ChargerCommsManager
from icharger.modbus_usb import connection_state_dict
from icharger.rq_comms_layer import RqChargerCommsManager


class AbstractChargerResource(Resource):
    def get_comms(self):
        debug_mode = os.environ.get("DEBUG_MODE", None)
        if debug_mode:
            return ChargerCommsManager()
        redisAddress = os.environ.get("REDIS_ADDRESS", "localhost")
        return RqChargerCommsManager(redisAddress)


class StatusResource(AbstractChargerResource):
    def get(self):
        try:
            comms = self.get_comms()
            info = comms.get_device_info()

            # groan
            if globals().get('__global__device_id') is None:
                globals()['__global__device_id'] = info.device_id

            obj = info.to_primitive()
            obj.update(connection_state_dict())

            return obj
        except Exception, e:
            return connection_state_dict(e)


class ChannelResource(AbstractChargerResource):
    def get(self, channel_id):
        try:
            channel = int(channel_id)
            if not (channel == 0 or channel == 1):
                raise ValueError("Channel part of URI must be 0 or 1")

            comms = self.get_comms()

            # yeh, more groan
            global__device_id = globals().get('__global__device_id')
            status = comms.get_channel_status(int(channel), global__device_id)

            obj = status.to_primitive()
            obj.update(connection_state_dict())

            return obj
        except Exception, e:
            return connection_state_dict(e)


class ControlRegisterResource(AbstractChargerResource):
    def get(self):
        try:
            comms = self.get_comms()
            control = comms.get_control_register()

            # note: intentionally no connection state
            return control.to_primitive()
        except Exception, e:
            return connection_state_dict(e)


class SystemStorageResource(AbstractChargerResource):
    def get(self):
        try:
            comms = self.get_comms()
            syst = comms.get_system_storage()

            obj = syst.to_primitive()
            obj.update(connection_state_dict())

            return obj
        except Exception, e:
            return connection_state_dict(e)


class PresetResource(AbstractChargerResource):
    def get(self, preset_id):
        pass

    def put(self, preset_id):
        pass


class PresetListResource(AbstractChargerResource):
    def get(self):
        try:
            comms = self.get_comms()
            count = comms.get_preset_list(count_only=True)

            all_presets = []
            for index in range(0, count):
                all_presets.append(comms.get_preset(index).to_native())

            return all_presets

        except Exception, e:
            return connection_state_dict(e)

    def post(self):
        pass
