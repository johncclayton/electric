import logging
import os

import evil_global

from flask_restful import Resource

from icharger.comms_layer import ChargerCommsManager
from icharger.modbus_usb import connection_state_dict

logger = logging.getLogger('electric.app.{0}'.format(__name__))


class AbstractChargerResource(Resource):
    def get_comms(self):
        debug_mode = os.environ.get("DEBUG_MODE", None)
        if debug_mode:
            logger.debug("Will use free ChargerCommsManager")
            return ChargerCommsManager(master=None, locking=False)

        logger.debug("Will use multiprocess Lock()ed ChargerCommsManager")
        return ChargerCommsManager(master=None, locking=True)

        # redisAddress = os.environ.get("REDIS_ADDRESS", "localhost")
        # logger.debug("Will use RQ ChargerCommsManager, at {0}".format(redisAddress))
        # return RqChargerCommsManager(redisAddress)


class TestResource(AbstractChargerResource):
    def get(self):
        comms = self.get_comms()
        comms.test_lock()
        return {'done': True}


class StatusResource(AbstractChargerResource):
    def get(self):
        try:
            comms = self.get_comms()
            info = comms.get_device_info()

            # groan0
            evil_global.last_seen_charger_device_id = info.device_id
            print "last seen: {0}".format(evil_global.last_seen_charger_device_id)

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
            print "last seen2: {0}".format(evil_global.last_seen_charger_device_id)
            status = comms.get_channel_status(int(channel), evil_global.last_seen_charger_device_id)

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
