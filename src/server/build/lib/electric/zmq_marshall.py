import zmq, os
import logging

logger = logging.getLogger('electric.app.{0}'.format(__name__))
worker_loc = os.environ.get("ELECTRIC_WORKER_CONNECT", "tcp://127.0.0.1:5001")

class ZMQCommsManager(object):
    """
    The comms manager is responsible for data translation between the charger (via ZMQ) and anyone else.
    Validation is not performed here - the data going in/out is assumed to be correct already.
    """
    locking = False

    def __init__(self):
        self.ctx = zmq.Context()

        self.charger = None
        self.request_tag = 0

        self.poll = zmq.Poller()
        self.open_charger_socket()

    def __del__(self):
        self.close_charger_socket()

    def close_charger_socket(self):
        logger.info("Disconnecting from worker")
        self.poll.unregister(self.charger)
        self.charger.close()
        self.charger = None

    def open_charger_socket(self):
        assert(self.charger is None)
        self.charger = self.ctx.socket(zmq.REQ)
        self.charger.set(zmq.REQ_RELAXED, 1)
        self.charger.set(zmq.REQ_CORRELATE, 1)

        logger.info("Connecting to worker at: %s", worker_loc)
        self.charger.connect(worker_loc)
        self.poll.register(self.charger, zmq.POLLIN)

    def _send_message_get_response(self, method_name, arg_dict = None):
        request = {
            "method": method_name,
            "tag": self.request_tag
        }

        self.request_tag += 1

        if arg_dict is not None:
            request["args"] = arg_dict

        self.charger.send_pyobj(request)
        sockets = dict(self.poll.poll(10000))
        if self.charger in sockets:
            try:
                e = None
                resp = self.charger.recv_pyobj()

                if "exception" in resp:
                    e = resp["exception"]
                    logger.error("exception received within ZMQ payload (will re-raise): {0}".format(e))
                elif "response" in resp:
                    r = resp["response"]
                    logger.debug("response message received: {0}".format(r))
                    return r
                else:
                    raise IOError("request received - but no response was found inside, terrible!")

            except Exception, f:
                logger.error("exception received during recv_pyobj: {0}".format(f))
                e = f

            # strange but true, fire the exception from here to replicate WSGI/embeddged HTTP server semantics
            if e is not None:
                raise e
        else:
            raise IOError("request {1} failed to receive a response at all from ZMQ within 10 seconds: {0}".format(method_name, request["tag"]))

    def turn_off_logging(self):
        return self._send_message_get_response("turn_off_logging")

    def get_device_info(self):
        """
        Returns the following information from the iCharger, known as the 'device only reads message'
        :return: a DeviceInfo instance
        """
        return self._send_message_get_response("get_device_info")

    def get_channel_status(self, channel, device_id=None):
        """"
        Returns the following information from the iCharger, known as the 'channel input read only' message:
        :return: ChannelStatus instance
        """
        return self._send_message_get_response("get_channel_status", {
            "channel": channel,
            "device_id": device_id
        })

    def get_control_register(self):
        "Returns the current run state of a particular channel"
        return self._send_message_get_response("get_control_register")

    def set_active_channel(self, channel):
        if channel not in (0, 1):
            return None

        self._send_message_get_response("set_active_channel", {
            "channel": channel
        })

    def get_system_storage(self):
        self._send_message_get_response("get_system_storage")

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


