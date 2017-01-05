from flask_restful import Resource

from electric.icharger.modbus_usb import iChargerMaster
from electric.icharger.modbus_usb import connection_state_dict

class Status_iCharger(Resource):
    def get(self):
        try:
            dev = iChargerMaster()
            obj = dev.get_device_info()
            obj.update(connection_state_dict())
            return obj
        except Exception, e:
            return connection_state_dict(e)


class ChannelStatus_iCharger(Resource):
    def get(self, channel_id):
        try:
            dev = iChargerMaster()
            channel = 1 if int(channel_id) == 1 else 2
            obj = dev.get_channel_status(int(channel))
            obj.update(connection_state_dict())
            return obj
        except Exception, e:
            return connection_state_dict(e)


class ControlRegister_iCharger(Resource):
    def get(self):
        try:
            dev = iChargerMaster()
            obj = dev.get_control_register()
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
        pass

    def post(self):
        pass
