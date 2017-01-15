import time

from redis import Redis
from rq import Connection
from rq import Queue

from icharger.comms_layer import ChargerCommsManager


class TestRQ(object):
    queue = None

    def __init__(self, redisAddress=None):
        if not redisAddress:
            redisAddress = "localhost"
        redis = Redis(redisAddress)
        with Connection(redis):
            self.queue = Queue()


    def restart(self):
        job = self.queue.enqueue("electric.worker.interface.restart")
        print "Started job {0}".format(job)



# t = TestRQ("192.168.1.30")
# t.restart()
#
# time.sleep(1)

c = ChargerCommsManager(master=None, locking=True)
c.get_device_info()
