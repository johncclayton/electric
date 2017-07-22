from electric.zmq_marshall import ZMQCommsManager
import zmq.utils.win32, logging, sys, time

from electric.worker.comms_layer import Operation

logger = logging.getLogger('electric.test')
comms = ZMQCommsManager()

def stop_application():
    sys.exit(0)

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

with zmq.utils.win32.allow_interrupt(stop_application):
    print comms.get_device_info()
    print comms.get_control_register()
    print comms.get_system_storage()
    print comms.get_full_preset_list()
    print comms.set_active_channel(0)
    print comms.set_active_channel(1)
    print comms.get_channel_status(0, None)
    print comms.get_channel_status(1, None)
    print comms.select_memory_program(0, 0)
    print comms.select_memory_program(0, 1)
    print comms.get_preset(0)
    print comms.get_preset(1)
    print comms.run_operation(Operation.Charge, 0, 0)
    time.sleep(5)
    print comms.stop_operation(0)
    print comms.stop_operation(0)
    print comms.measure_ir(0)
    time.sleep(5)
    print comms.stop_operation(0)
    print comms.stop_operation(0)
