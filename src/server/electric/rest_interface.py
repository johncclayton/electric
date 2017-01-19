import logging
from flask_restful import Resource
from icharger.modbus_usb import connection_state_dict

# All Evil is put into its own little container.
import evil_global

logger = logging.getLogger('electric.app.{0}'.format(__name__))

RETRY_LIMIT = 30

def exclusive(func):
    def wrapper(self, *args, **kwargs):
        with evil_global.lock:
            retry = 0
            while retry < RETRY_LIMIT:
                try:
                    return func(self, *args, **kwargs)

                except Exception, usb_err:
                    retry += 1

                    logging.error("%s, reset bus and retrying (count is at %d/%d)", usb_err, retry, RETRY_LIMIT)

                    evil_global.comms.reset()

                    if retry >= RETRY_LIMIT:
                        logger.error("retry limit exceeded, aborting the call completely")
                        return connection_state_dict(usb_err), 504

    return wrapper


class StatusResource(Resource):
    @exclusive
    def get(self):
        info = evil_global.comms.get_device_info()

        evil_global.last_seen_charger_device_id = info.device_id

        obj = info.to_primitive()
        obj.update(connection_state_dict())

        return obj


class ChannelResource(Resource):
    @exclusive
    def get(self, channel_id):
        channel = int(channel_id)
        if not (channel == 0 or channel == 1):
            return connection_state_dict("Channel number must be 0 or 1"), 403

        # yeh, more groan
        status = evil_global.comms.get_channel_status(int(channel), evil_global.last_seen_charger_device_id)

        obj = status.to_primitive()
        obj.update(connection_state_dict())

        return obj


class ControlRegisterResource(Resource):
    @exclusive
    def get(self):
        control = evil_global.comms.get_control_register()

        # note: intentionally no connection state
        return control.to_primitive()


class SystemStorageResource(Resource):
    @exclusive
    def get(self):
        syst = evil_global.comms.get_system_storage()

        obj = syst.to_primitive()
        obj.update(connection_state_dict())

        return obj


class PresetResource(Resource):
    @exclusive
    def get(self, preset_id):
        pass

    @exclusive
    def put(self, preset_id):
        pass


class PresetListResource(Resource):
    @exclusive
    def get(self):
        count = evil_global.comms.get_preset_list(count_only=True)

        all_presets = []
        for index in range(0, count):
            all_presets.append(evil_global.comms.get_preset(index).to_native())

        return all_presets


    @exclusive
    def post(self):
        pass
