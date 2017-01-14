from icharger.comms_layer import ChargerCommsManager

__global_charger = ChargerCommsManager()

def get_device_info():
    global __global_charger
    return __global_charger.get_device_info()