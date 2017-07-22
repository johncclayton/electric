import logging, threading

logger = logging.getLogger('electric.worker.router')
lock = threading.Lock()


def route_message(charger, method, args):
    if not lock.acquire(False):
        raise threading.ThreadError("request being processed by worker - but there is already one in-flight - worldly assumptions have been damaged")

    try:
        if method == "get_device_info":
            return charger.get_device_info()
        elif method == "get_channel_status":
            return charger.get_channel_status(args["channel"], args["device_id"])
        elif method == "get_control_register":
            return charger.get_control_register()
        elif method == "set_active_channel":
            return charger.set_active_channel(args["channel"])
        elif method == "get_system_storage":
            return charger.get_system_storage()
        elif method == "save_system_storage":
            return charger.save_system_storage(args["storage"])
        elif method == "select_memory_program":
            return charger.select_memory_program(args["memory_slot"], args["channel"])
        elif method == "save_full_preset_list":
            return charger.save_full_preset_list(args["preset_list"])
        elif method == "get_full_preset_list":
            return charger.get_full_preset_list()
        elif method == "get_preset":
            return charger.get_preset(args["memory_slot"])
        elif method == "delete_preset_at_index":
            return charger.delete_preset_at_index(args["memory_slot"])
        elif method == "add_new_preset":
            return charger.add_new_preset(args["preset"])
        elif method == "save_preset_to_memory_slot":
            return charger.save_preset_to_memory_slot(args["preset"], args["memory_slot"], args["write_to_flash"], args["verify_write"])
        elif method == "stop_operation":
            return charger.stop_operation(args["channel"])
        elif method == "run_operation":
            return charger.run_operation(args["op"], args["channel"], args["memory_slot"])
        elif method == "measure_ir":
            return charger.measure_ir(args["channel"])
        else:
            raise IOError("Unknown method name, cannot execute anything: {0}".format(method))

    finally:
        lock.release()