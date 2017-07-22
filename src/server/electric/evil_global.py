import multiprocessing, logging

from zmq_marshall import ZMQCommsManager

logger = logging.getLogger('electric.app.{0}'.format(__name__))

# A lock used for multiprocess sharing in gunicorn
lock = multiprocessing.Lock()

# The single instance used to talk to the iCharger
comms = ZMQCommsManager()

