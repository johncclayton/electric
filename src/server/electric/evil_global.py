import logging
import multiprocessing

from electric.icharger.comms_layer import ChargerCommsManager

logger = logging.getLogger('electric.app.{0}'.format(__name__))

# A lock used for multiprocess sharing in gunicorn
lock = multiprocessing.Lock()

# The single instance used to talk to the iCharger
comms = ChargerCommsManager()

