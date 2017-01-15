import multiprocessing

# A lock used for multiprocess sharing in gunicorn
lock = multiprocessing.Lock()

# The last seen ID of the connected charger device
last_seen_charger_device_id = None