import time

from redis import Redis
from rq import Connection
from rq import Queue

from worker.interface import get_device_info, get_channel_status, get_control_register, get_system_storage, get_preset_list, get_preset


class RqChargerCommsManager(object):
    queue = None

    def __init__(self, redisAddress=None):
        super(RqChargerCommsManager, self).__init__()
        if not redisAddress:
            redisAddress = "192.168.1.30"
        with Connection(Redis(redisAddress)):
            self.queue = Queue()

    def _blocking_call(self, call, *args, **kwargs):
        job = self.queue.enqueue(call, *args, **kwargs)

        # Wait for completion
        for i in range(0, 1000):
            # Did it throw?
            if job.exc_info:
                raise job.exc_info

            # Got info?
            if job.result:
                return job.result

            # Wait some more - this sucks, but hey
            time.sleep(1.0 / 10.0)

        raise Exception("Failed to call method on the back end. Waited 10s.")

    def get_device_info(self):
        return self._blocking_call(get_device_info)

    def get_channel_status(self, channel):
        return self._blocking_call(get_channel_status, channel)

    def get_control_register(self):
        return self._blocking_call(get_control_register)

    def get_system_storage(self):
        return self._blocking_call(get_system_storage)

    def get_preset_list(self, count_only):
        return self._blocking_call(get_preset_list, count_only)

    def get_preset(self, index):
        return self._blocking_call(get_preset, index)
