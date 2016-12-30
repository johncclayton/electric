from flask_restful import Resource

from icharger.modbus_usb import iChargerMaster

class Status_iCharger(Resource):
    def __init__(self):
        super(Status_iCharger, self).__init__()

    def get(self):
        dev = iChargerMaster()
        return dev.get_device_info()

class ChannelStatus_iCharger(Resource):
    def __init__(self):
        super(ChannelStatus_iCharger, self).__init__()

    def get(self, channel_id):
        dev = iChargerMaster()
        channel = 1 if int(channel_id) == 1 else 2
        return dev.get_channel_status(int(channel))





