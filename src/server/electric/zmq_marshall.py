import zmq, os
import logging
from electric import testing_control as testing_control

logger = logging.getLogger('electric.app.{0}'.format(__name__))


def get_worker_loc():
    return os.environ.get("ELECTRIC_WORKER", "tcp://127.0.0.1:5001")


RESPONSE_TIMEOUT_MS = 5000


class ZMQCommsManager(object):
    """
    The comms manager is responsible for data translation between the charger (via ZMQ) and anyone else.
    Validation is not performed here - the data going in/out is assumed to be correct already.
    """
    locking = False

    def __init__(self):
        self.ctx = zmq.Context()

        self.charger_socket = None
        self.request_tag = 0

        self.poll = zmq.Poller()
        self.open_charger_socket()

    def __del__(self):
        self.close_charger_socket()

    def close_charger_socket(self):
        logger.info("Disconnecting from worker")
        self.poll.unregister(self.charger_socket)
        self.charger_socket.close()
        self.charger_socket = None

    def open_charger_socket(self):
        assert (self.charger_socket is None)
        self.charger_socket = self.ctx.socket(zmq.REQ)
        self.charger_socket.set(zmq.REQ_RELAXED, 1)
        self.charger_socket.set(zmq.REQ_CORRELATE, 1)

        logger.info("Connecting to worker at: %s", get_worker_loc())
        self.charger_socket.connect(get_worker_loc())
        self.poll.register(self.charger_socket, zmq.POLLIN)

    def close_and_reopen_connection(self):
        logger.info("Resetting ZMQ connection")
        self.close_charger_socket()
        self.open_charger_socket()

    def _send_message_get_response(self, method_name, arg_dict=None):
        request = {
            "testing-control": testing_control.values,
            "method": method_name,
            "tag": self.request_tag
        }

        self.request_tag += 1

        if arg_dict is not None:
            request["args"] = arg_dict

        try:
            self.charger_socket.send_pyobj(request)
            sockets = dict(self.poll.poll(RESPONSE_TIMEOUT_MS))
            if self.charger_socket in sockets:
                e = None

                try:
                    resp = self.charger_socket.recv_pyobj()

                    if "raises" in resp:
                        e = resp["raises"]
                        logger.error("message received from ZMQ, contained exception: {0}".format(e))
                    elif "response" in resp:
                        r = resp["response"]
                        logger.debug("response message received: {0}".format(r))
                        return r
                    else:
                        e = IOError("request received - but no response was found inside, terrible!")

                except Exception, f:
                    logger.error("exception received when reading message from ZMQ: {0}".format(f))
                    e = f

                # if we get here, e MUST be set
                assert (e is not None)

                raise e
            else:
                # connection is gone - lets re-open it
                self.close_and_reopen_connection()
                timeout_s = int(RESPONSE_TIMEOUT_MS / 1000.0)
                raise IOError("request {1} failed to receive a response at all from ZMQ within {2} seconds: {0}".format(method_name, request["tag"], timeout_s))
        except Exception, e:
            # Can't send, most likely
            self.close_and_reopen_connection()
            timeout_s = int(RESPONSE_TIMEOUT_MS / 1000.0)
            raise IOError("failed to send request {1} to ZMQ: {0}, {2}".format(method_name, request["tag"], e))

    def turn_off_logging(self):
        return self._send_message_get_response("turn_off_logging")

    def get_device_info(self):
        """
        Returns the following information from the iCharger, known as the 'device only reads message'
        :return: a DeviceInfo instance
        """
        return self._send_message_get_response("get_device_info")

    def get_channel_status(self, channel):
        """"
        Returns the following information from the iCharger, known as the 'channel input read only' message:
        :return: ChannelStatus instance
        """
        return self._send_message_get_response("get_channel_status", {
            "channel": channel
        })

    def get_control_register(self):
        "Returns the current run state of a particular channel"
        return self._send_message_get_response("get_control_register")

    def set_active_channel(self, channel):
        if channel not in (0, 1):
            return None

        return self._send_message_get_response("set_active_channel", {
            "channel": channel
        })

    def set_beep_properties(self, beep_index=0, enabled=True, volume=5):
        return self._send_message_get_response("set_beep_properties", {
            "beep_index": beep_index,
            "enabled": enabled,
            "volume": volume
        })

    def get_system_storage(self):
        return self._send_message_get_response("get_system_storage")

    def save_system_storage(self, system_storage_object):
        self._send_message_get_response("save_system_storage", {
            "storage": system_storage_object
        })

        return True

    def select_memory_program(self, memory_slot, channel_number=0):
        return self._send_message_get_response("select_memory_program", {
            "memory_slot": memory_slot,
            "channel": channel_number
        })

    def save_full_preset_list(self, preset_list):
        return self._send_message_get_response("save_full_preset_list", {
            "preset_list": preset_list
        })

    def find_preset_with_name(self, named):
        for preset in self.get_all_presets():
            preset_name = preset.name
            lowercase_name = str.lower(preset_name)
            lower_case_wanted = str.lower(named)
            if lowercase_name == lower_case_wanted:
                return preset
        return None

    def get_all_presets(self):
        preset_list = self.get_full_preset_list()
        # TODO: Error handling

        all_presets = []
        for index in preset_list.range_of_presets():
            # Preset.index is the memory slot it's in, not the position within the index
            memory_slot_number = preset_list.indexes[index]
            preset = self.get_preset(memory_slot_number)
            if preset.is_used or preset.is_fixed:
                all_presets.append(preset)

        return all_presets

    def get_full_preset_list(self):
        return self._send_message_get_response("get_full_preset_list")

    def get_preset(self, memory_slot_number):
        return self._send_message_get_response("get_preset", {
            "memory_slot": memory_slot_number
        })

    def delete_preset_at_index(self, preset_memory_slot_number):
        return self._send_message_get_response("delete_preset_at_index", {
            "memory_slot": preset_memory_slot_number
        })

    def add_new_preset(self, preset):
        '''
        This ALWAYS saves a NEW preset. The presets memory_slot is ignored, and it's
        inserted at the end of the preset index list.
        '''
        return self._send_message_get_response("add_new_preset", {
            "preset": preset
        })

    def save_preset_to_memory_slot(self, preset, memory_slot, write_to_flash=True, verify_write=True):
        '''
        This saves an existing preset to memory.
        It does NOT allocate new presets, or insert them into a preset index list
        '''
        return self._send_message_get_response("save_preset_to_memory_slot", {
            "preset": preset,
            "memory_slot": memory_slot,
            "write_to_flash": write_to_flash,
            "verify_write": verify_write
        })

    def stop_operation(self, channel_number):
        return self._send_message_get_response("stop_operation", {
            "channel": channel_number
        })

    def run_operation(self, operation, channel_number, preset_memory_slot_index=0):
        return self._send_message_get_response("run_operation", {
            "op": operation,
            "channel": channel_number,
            "memory_slot": preset_memory_slot_index
        })

    def measure_ir(self, channel_number):
        channel_number = min(1, max(0, channel_number))

        return self._send_message_get_response("measure_ir", {
            "channel": channel_number
        })

    def get_case_fan_info(self):
        return self._send_message_get_response("get_case_fan_info")

    def set_case_fan_prefs(self, case_fan_object):
        return self._send_message_get_response("set_case_fan_prefs", case_fan_object)

    # RFID Tag methods
    def start_tag_reading(self):
        return self._send_message_get_response("start_tag_reading")
    
    def stop_tag_reading(self):
        return self._send_message_get_response("stop_tag_reading")
    
    def get_tag_list(self):
        return self._send_message_get_response("get_tag_list")
    
    def kill_tag_reading(self):
        return self._send_message_get_response("kill_tag_reading")
    
    def write_tag(self, rfid_write_info):
        return self._send_message_get_response("write_tag", rfid_write_info)
    
    def get_tag_write_result(self):
        return self._send_message_get_response("get_tag_write_result")
        
    def kill_tag_writing():
        return self._send_message_get_response("kill_tag_writing")
