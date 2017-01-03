from flask_restful import Resource

from electric.icharger.modbus_usb import iChargerMaster
from electric.icharger.modbus_usb import exception_dict

class Status_iCharger(Resource):
    def __init__(self):
        super(Status_iCharger, self).__init__()

    def get(self):
        try:
            dev = iChargerMaster()
            return dev.get_device_info()
        except Exception, e:
            return exception_dict(e)


class ChannelStatus_iCharger(Resource):
    def __init__(self):
        super(ChannelStatus_iCharger, self).__init__()

    def get(self, channel_id):
        try:
            dev = iChargerMaster()
            channel = 1 if int(channel_id) == 1 else 2
            return dev.get_channel_status(int(channel))
        except Exception, e:
            return exception_dict(e)


class ControlRegister_iCharger(Resource):
    def __init__(self):
        super(ControlRegister_iCharger, self).__init__()

    def get(self):
        try:
            dev = iChargerMaster()
            return dev.get_control_register()
        except Exception, e:
            return exception_dict(e)


class SystemStorage_iCharger(Resource):
    def __init__(self):
        super(SystemStorage_iCharger, self).__init__()

    def get(self):
        try:
            dev = iChargerMaster()
            return dev.get_system_storage()
        except Exception, e:
            return exception_dict(e)



