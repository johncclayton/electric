# testing module, to check understanding of modbus-tk with iCharger 4010 DUO USB HUD interface
import modbus_tk
from server.icharger.usb import iChargerMaster
# from modbus_tk.utils import get_log_buffer
from modbus_tk import LOGGER

def main():
    logger = modbus_tk.utils.create_logger("console")

    master = iChargerMaster()
    master.set_verbose(True)

    LOGGER.info(master.get_device_info())
    LOGGER.info(master.get_channel_status(1))
    LOGGER.info(master.get_channel_status(2))

if __name__ == "__main__":
    main()
