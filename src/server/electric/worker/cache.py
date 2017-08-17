import time, logging

from electric import testing_control as testing_control

logger = logging.getLogger('electric.worker.router')

#
# class CachedValue(object):
#     cache_expiry_seconds = 1.0
#
#     def __init__(self, v = None):
#         super(CachedValue, self).__init__()
#         self.updated = None
#         self.attr = v
#
#     def set_stale(self):
#         self.updated = None
#
#     @property
#     def value(self):
#         return self.attr
#
#     @value.setter
#     def value(self, new_value):
#         self.attr = new_value
#         self.updated = time.time()
#
#     @property
#     def is_stale(self):
#         if testing_control.values.bypass_caches:
#             return True
#
#         if self.updated is None:
#             return True
#
#         right_now = time.time()
#         difference = right_now - self.updated
#
#         return difference >= CachedValue.cache_expiry_seconds
#

cache = {
    "device_id": None,
    "device_info": None,
    "channel": [ None, None ]
}


def reset_caches():
    global cache
    cache = {
        "device_id": None,
        "device_info": None,
        "channel": [ None, None ]
    }


def get_device_info_cached():
    return cache["device_info"]


def set_device_info_cached(device_info):
    cache["device_info"] = device_info
    logging.debug("stored device_info")


def get_channel_status_cached(channel):
    channel = int(channel)
    assert (channel == 0 or channel == 1)
    return cache["channel"][channel]


def set_channel_status(channel, status):
    channel = int(channel)
    assert (channel == 0 or channel == 1)
    cache["channel"][channel] = status
    logging.debug("stored channel {0} status".format(channel))