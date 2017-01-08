from flask_restful import Resource

from electric.icharger.modbus_usb import connection_state_dict
from icharger.comms_layer import ChargerCommsManager

comms = ChargerCommsManager()

class Status_iCharger(Resource):
    def get(self):
        try:
            info = comms.get_device_info()

            obj = info.to_primitive()
            obj.update(connection_state_dict())

            return obj
        except Exception, e:
            return connection_state_dict(e)


class ChannelStatus_iCharger(Resource):
    def get(self, channel_id):
        try:
            channel = int(channel_id)
            if not (channel == 0 or channel == 1):
                raise ValueError("Channel part of URI must be 0 or 1")

            status = comms.get_channel_status(int(channel))

            obj = status.to_primitive()
            obj.update(connection_state_dict())

            return obj
        except Exception, e:
            return connection_state_dict(e)


class ControlRegister_iCharger(Resource):
    def get(self):
        try:
            control = comms.get_control_register()

            # note: intentionally no connection state
            return control.to_primitive()
        except Exception, e:
            return connection_state_dict(e)


class SystemStorage_iCharger(Resource):
    def get(self):
        try:
            syst = comms.get_system_storage()

            obj = syst.to_primitive()
            obj.update(connection_state_dict())

            return obj
        except Exception, e:
            return connection_state_dict(e)


class Memory_iCharger(Resource):
    def get(self):
        pass

    def put(self):
        pass


class MemoryList_iCharger(Resource):
    def get(self):
        # request all of the settings, providing their index value for lookup.
        pass

    def post(self):
        pass
