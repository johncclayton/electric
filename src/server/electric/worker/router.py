import logging
import electric.worker.cache as cache
import electric.testing_control as testing_control
from electric.worker.casefancontrol import CaseFanControl

logger = logging.getLogger('electric.worker.router')
fan_control = CaseFanControl()


#
# NOTE: this caches ONLY the GET requests, not the other uses of get_device_info() that are internal to the operation
# of the run_op/stop_op methods.
#


def route_message(charger, method, args):
    if method == "get_device_info":
        if testing_control.values.bypass_caches:
            return charger.get_device_info()
        return cache.values.get_device_info()
    elif method == "get_channel_status":
        if testing_control.values.bypass_caches:
            return charger.get_channel_status(args["channel"])
        return cache.values.get_channel_status(args["channel"])
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
    elif method == "turn_off_logging":
        return charger.turn_off_logging()
    elif method == "set_beep_properties":
        return charger.set_beep_properties(args["beep_index"], args["enabled"], args["volume"])
    elif method == "get_case_fan_info":
        info = fan_control.prefs;
        info["running"] = cache.values.get_case_fan_run_state()
        return info
    elif method == "set_case_fan_prefs":
        fan_control.set_control_onoff(args["control"])
        fan_control.set_temp_threshold(args["threshold"])
        fan_control.set_temp_tolerance(args["tolerance"])
        fan_control.set_gpio_pin(args["gpio"])
        return fan_control.save_prefs()
    else:
        raise IOError("Unknown method name, cannot execute anything: {0}".format(method))

