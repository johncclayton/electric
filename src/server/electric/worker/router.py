import logging, threading, time

logger = logging.getLogger('electric.worker.router')
lock = threading.Lock()


class CachedValue(object):
    cache_expiry_seconds = 1.0

    def __init__(self, v = None):
        super(CachedValue, self).__init__()
        self.updated = None
        self.attr = v

    def set_stale(self):
        self.updated = None

    @property
    def value(self):
        return self.attr

    @value.setter
    def value(self, new_value):
        self.attr = new_value
        self.updated = time.time()

    @property
    def is_stale(self):
        if self.updated is None:
            return True

        right_now = time.time()
        difference = right_now - self.updated

        return difference >= CachedValue.cache_expiry_seconds


cached_device_info = CachedValue()
cached_channel_status = [CachedValue(), CachedValue()]


#
# NOTE: this caches ONLY the GET requests, not the other uses of get_device_info() that are internal to the operation
# of the run_op/stop_op methods.
#
def get_device_info_cached(charger):
    if cached_device_info.is_stale:
        value = charger.get_device_info()
        cached_device_info.value = value
    else:
        value = cached_device_info.value
    return value


def get_channel_status_cached(charger, channel, device_id):
    channel = int(channel)
    assert (channel == 0 or channel == 1)

    if cached_channel_status[channel].is_stale:
        value = charger.get_channel_status(channel, device_id)
        cached_channel_status[channel].value = value
    else:
        value = cached_channel_status[channel].value
    return value


def route_message(charger, method, args):
    if not lock.acquire(False):
        raise threading.ThreadError("request being processed by worker - but there is already one in-flight - worldly assumptions have been damaged")

    try:
        if method == "get_device_info":
            return get_device_info_cached(charger)
        elif method == "get_channel_status":
            return get_channel_status_cached(charger, args["channel"], args["device_id"])
        elif method == "get_control_register":
            return charger.get_control_register()
        elif method == "set_active_channel":
            return charger.set_active_channel(args["channel"])
        elif method == "get_system_storage":
            return charger.get_system_storage()
        elif method == "save_system_storage":
            return charger.save_system_storage(args["storage"])
        elif method == "select_memory_program":
            return charger.select_memory_program(args["memory_slot"], args["channel"])
        elif method == "save_full_preset_list":
            return charger.save_full_preset_list(args["preset_list"])
        elif method == "get_full_preset_list":
            return charger.get_full_preset_list()
        elif method == "get_preset":
            return charger.get_preset(args["memory_slot"])
        elif method == "delete_preset_at_index":
            return charger.delete_preset_at_index(args["memory_slot"])
        elif method == "add_new_preset":
            return charger.add_new_preset(args["preset"])
        elif method == "save_preset_to_memory_slot":
            return charger.save_preset_to_memory_slot(args["preset"], args["memory_slot"], args["write_to_flash"], args["verify_write"])
        elif method == "stop_operation":
            return charger.stop_operation(args["channel"])
        elif method == "run_operation":
            return charger.run_operation(args["op"], args["channel"], args["memory_slot"])
        elif method == "measure_ir":
            return charger.measure_ir(args["channel"])
        elif method == "turn_off_logging":
            return charger.turn_off_logging()
        else:
            raise IOError("Unknown method name, cannot execute anything: {0}".format(method))

    finally:
        lock.release()