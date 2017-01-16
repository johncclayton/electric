import multiprocessing, logging

from icharger.comms_layer import ChargerCommsManager

logger = logging.getLogger('electric.app.{0}'.format(__name__))

# A lock used for multiprocess sharing in gunicorn
lock = multiprocessing.Lock()

# The last device_id value seen during a call to /status / get_device_info()
last_seen_charger_device_id = None

# The single instance used to talk to the iCharger
comms = ChargerCommsManager()

