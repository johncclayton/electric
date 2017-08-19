import datetime
import threading
import time
import logging

from electric.worker import cache as cache
logger = logging.getLogger('electric.worker.statusthread')


class StatusThread(threading.Thread):
    def __init__(self, my_charger):
        super(StatusThread, self).__init__(name="Fetch Status from Charger")
        self.daemon = True
        self.comms = my_charger
        self.wait_time = 0.5
        self.keep_going = True

    def run(self):
        while self.keep_going:
            # fetch charger status, channel 0/1 and store
            # pause to breath - it is after all only good form
            try:
                start_time = datetime.datetime.now()

                device_info = self.comms.get_device_info()
                if device_info and self.keep_going:
                    cache.values.set_device_info(device_info)

                    for channel in range(0, device_info.channel_count):
                        channel_status = self.comms.get_channel_status(channel, device_info.device_id)
                        if channel == 0 or channel == 1:
                            cache.values.set_channel_status(channel, channel_status)
                        if not self.keep_going:
                            return

                end_time = datetime.datetime.now()

                # wait for about 500ms minus the time it took, in other words - try to update these twice a second
                elapsed_ms = end_time - start_time
                wait_seconds = self.wait_time - elapsed_ms.total_seconds()

                # logger.warn("*** status fetch completed, elapsed_sec: {0}, will now wait: {1}".format(elapsed_ms.total_seconds(), wait_seconds))

                if wait_seconds > 0:
                    time.sleep(wait_seconds)
                else:
                    time.sleep(0.5)

            except Exception, e:
                logger.error("exception while reading status/channel info: {0}".format(e))
                time.sleep(5)