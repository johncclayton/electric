import multiprocessing, logging
from electric.icharger.capture import Capture

from electric.icharger.comms_layer import ChargerCommsManager

logger = logging.getLogger('electric.app.{0}'.format(__name__))

# A lock used for multiprocess sharing in gunicorn
lock = multiprocessing.Lock()
capture = Capture()

# The single instance used to talk to the iCharger
comms = ChargerCommsManager(capture)

