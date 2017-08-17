import logging, time
import unittest

from electric.worker.cache import CachedValue, cached_channel_status
from electric.worker.router import route_message

logger = logging.getLogger(__name__)

CachedValue.cache_expiry_seconds = 1.0

class FakeCharger(object):
    def __init__(self):
        self.value = 42

    def get_device_info(self):
        return self.value

    def get_channel_status(self, channel, device_id):
        if int(channel) == 0:
            return self.value
        return 56


class TestMyLittlePonyCache(unittest.TestCase):
    def test_cache_isnt_entirely_broken(self):
        v = CachedValue()

        self.assertTrue(v.value is None)
        self.assertTrue(v.updated is None)

        v.value = 3

        self.assertIsNotNone(v.value)
        self.assertIsNotNone(v.updated)
        self.assertFalse(v.is_stale)

        # wait for a bit
        time.sleep(CachedValue.cache_expiry_seconds + 0.4)
        self.assertTrue(v.is_stale)

        # setting a value clears stale
        v.value = 12
        self.assertEqual(12, v.value)
        self.assertFalse(v.is_stale)

    def test_router_caching_device_info(self):
        charger = FakeCharger()
        info = route_message(charger, "get_device_info", None)
        self.assertEqual(info, 42)

        # change the value, but the cache will return the old one
        charger.value = 12
        info2 = route_message(charger, "get_device_info", None)
        self.assertEqual(info, 42)

        # until we wait a bit...
        time.sleep(CachedValue.cache_expiry_seconds + 0.2)
        info2 = route_message(charger, "get_device_info", None)
        self.assertEqual(info2, 12)

    def test_router_get_channel_status_cached(self):
        charger = FakeCharger()
        info = route_message(charger, "get_channel_status", { "channel": 0, "device_id": 0 })
        self.assertIsNotNone(info)

        info = route_message(charger, "get_channel_status", { "channel": 1, "device_id": 0 })
        self.assertIsNotNone(info)

        info = route_message(charger, "get_channel_status", { "channel": "0", "device_id": 0 })
        self.assertIsNotNone(info)

        info = route_message(charger, "get_channel_status", { "channel": "1", "device_id": 0 })
        self.assertIsNotNone(info)

        with self.assertRaises(AssertionError) as exp:
            route_message(charger, "get_channel_status", {"channel": "2", "device_id": 0 })

        # fetch channel 0 status
        cached_channel_status[0].set_stale()
        cached_channel_status[1].set_stale()

        charger.value = 12
        info = route_message(charger, "get_channel_status", {"channel": "0", "device_id": 0 })
        info2 = route_message(charger, "get_channel_status", {"channel": "1", "device_id": 0 })

        self.assertEqual(12, info)
        self.assertEqual(56, info2)

if __name__ == "__main__":
    unittest.main()