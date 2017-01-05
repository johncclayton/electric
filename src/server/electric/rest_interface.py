from flask_restful import Resource

from electric.icharger.modbus_usb import iChargerMaster
from electric.icharger.modbus_usb import connection_state_dict

class Status_iCharger(Resource):
    def get(self):
        try:
            dev = iChargerMaster()
            info = dev.get_device_info()

            obj = info.to_dict()
            obj.update(connection_state_dict())

            return obj
        except Exception, e:
            return connection_state_dict(e)


class ChannelStatus_iCharger(Resource):
    def get(self, channel_id):
        try:
            dev = iChargerMaster()
            channel = int(channel_id)
            if not (channel == 0 or channel == 1):
                raise ValueError("Channel part of URI must be 0 or 1")
            status = dev.get_channel_status(int(channel))

            obj = status.to_dict()
            obj.update(connection_state_dict())

            return obj
        except Exception, e:
            return connection_state_dict(e)


class ControlRegister_iCharger(Resource):
    def get(self):
        try:
            dev = iChargerMaster()
            control = dev.get_control_register()
            obj = control.to_dict()
            return obj
        except Exception, e:
            return connection_state_dict(e)


class SystemStorage_iCharger(Resource):
    def get(self):
        try:
            dev = iChargerMaster()
            obj = dev.get_system_storage()
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
