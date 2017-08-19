import array
import hid
import logging
import struct
import threading
import time, sys
import traceback

import modbus_tk.defines as cst
from modbus_tk.exceptions import ModbusInvalidRequestError, ModbusInvalidResponseError
from modbus_tk.modbus import Query
from modbus_tk.modbus_rtu import RtuMaster

from electric.testing_control import TestingControlException
import electric.testing_control as testing_control

logger = logging.getLogger('electric.worker.{0}'.format(__name__))

MEMORY_MAX = 64
MODBUS_HID_FRAME_TYPE = 0x30

ICHARGER_VENDOR_ID = 0x0483
ICHARGER_PRODUCT_ID = 0x5751

END_POINT_ADDRESS_WRITE = 0x01
END_POINT_ADDRESS_READ = 0x81

MAX_READWRITE_LEN = 64
READ_REG_COUNT_MAX = 30
WRITE_REG_COUNT_MAX = 28

ModbusErrors = [
    {"c": "MB_EOK", "v": 0x00},
    {"c": "MB_EX_ILLEGAL_FUNCTION", "v": 0x01},
    {"c": "MB_EX_ILLEGAL_DATA_ADDRESS", "v": 0x02},
    {"c": "MB_EX_ILLEGAL_DATA_VALUE", "v": 0x03},
    {"c": "MB_EX_SLAVE_DEVICE_FAILURE", "v": 0x04},
    {"c": "MB_EX_ACKNOWLEDGE", "v": 0x05},
    {"c": "MB_EX_SLAVE_BUSY", "v": 0x06},
    {"c": "MB_EX_MEMORY_PARITY_ERROR", "v": 0x08},
    {"c": "MB_EX_GATEWAY_PATH_FAILED", "v": 0x0A},
    {"c": "MB_EX_GATEWAY_TGT_FAILED", "v": 0x0B},
    {"c": "MB_ENOREG", "v": 0x80, "d": "Illegal register address"},
    {"c": "MB_EILLFUNCTION", "v": 0x81, "d": "Illegal function code"},
    {"c": "MB_EIO", "v": 0x82, "d": "I/O error"},
    {"c": "MB_ERETURN", "v": 0x83, "d": "protocol stack in illegal state"},
    {"c": "MB_ELEN", "v": 0x84, "d": "Pack len arg error"},
    {"c": "MB_ETIMEDOUT", "v": 0x85, "d": "Timeout error occurred"},
]

#
# NOTE: This isnt' relevant for Docker based installs - things run as root there anyway.
#
# Want user-land access to the device?  Looking for an easier way, tired of sudo <command>
# and having op-sec experts scorn you at the water cooler?
#
# HINT, you can use the following single line in /etc/udev/rules.d/10-icharger4010.rules
# SUBSYSTEMS=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5751", MODE:="0666"
#
# Once you have added this single line of text to the file, ask udevd to re-read configuration:
# $ udevadm control --reload-rules
#
# But you NEED to unplug/plug-in the device for this to work - or REBOOT the pi.
#

class iChargerQuery(Query):
    """
    Subclass of a Query. Adds the Modbus specific part of the protocol for iCharger over USB, which uses
    a rather specific protocol format to send the PDU.

    Please note - read/writes are limited to 64 bytes, whereby the PDU is prefixed with two bytes, <ADU len>
    and 0x30 respectively.

    The 'slave' portion of the protocol goes unused because, I presume, the iCharger provides only a
    single modbus slave - or because of coconuts.
    """

    def __init__(self):
        """Constructor"""
        super(iChargerQuery, self).__init__()
        self.adu_len = None
        self.start_addr = None
        self.quantity = None
        self.modbus_error = None

    def build_request(self, pdu, slave):
        """ Constructs the output buffer for the request based on the func_code value """
        (self.func_code, self.start_addr, self.quantity) = struct.unpack(">BHH", pdu[0:5])

        if self.func_code == cst.READ_INPUT_REGISTERS or self.func_code == cst.READ_HOLDING_REGISTERS:
            self.adu_len = 7
        elif self.func_code == cst.WRITE_MULTIPLE_REGISTERS:
            self.adu_len = 7 + (self.quantity * 2) + 1
        else:
            raise ModbusInvalidRequestError("Request func code not recognized (code is: {0})".format(self.func_code))

        return struct.pack(">BB", self.adu_len, MODBUS_HID_FRAME_TYPE) + pdu

    def parse_response(self, response):
        if len(response) < 3:
            raise ModbusInvalidResponseError("Response length is invalid {0}".format(len(response)))

        (self.response_length, self.adu_constant, self.response_func_code, self.modbus_error) = \
            struct.unpack("=BBBB", response[0:4])

        if self.response_length > MAX_READWRITE_LEN:
            raise ModbusInvalidResponseError("Response length is greater than {0}".format(MAX_READWRITE_LEN))

        if self.response_func_code == self.func_code:
            # primitive byte swap the entire thing... but only if this is the READ INPUT/HOLDING type
            if self.func_code == cst.READ_HOLDING_REGISTERS or self.func_code == cst.READ_INPUT_REGISTERS:
                header = response[2:4]
                data = response[4:]
                response = header + ''.join([c for t in zip(data[1::2], data[::2]) for c in t])
            else:
                # skip len/adu const - returning everything else
                response = response[2:]

            self.modbus_error = 0
        else:
            if self.response_func_code == self.func_code | 0x80:
                raise ModbusInvalidResponseError(
                    "Response contains error code {0}: {1}".format(self.modbus_error,
                                                                   self._modbus_error_string(self.modbus_error))
                )
            # else:
            #     # skip len/adu const - returning everything else - this avoids bitching about invalid reads, but
            #     # of course does not solve the root problem.
            #     response = response[2:]

            self.modbus_error = 0

        return response

    @staticmethod
    def _modbus_error_string(code):
        for err in ModbusErrors:
            if err["v"] == code:
                if "d" in err:
                    return "{0} ({1})".format(err["c"], err["d"])
                return err["c"]

        return "Unknown Code"


class USBThreadedReader:
    """
    Implements facade such that the ModBus Master thinks it is using a serial
    device when talking to the iCharger via USB-HID.

    USBThreadedReader sets the active USB configuration and claims the interface,
    take note - this must be released when the instance is cleaned up / destroyed.  If
    the USB device cannot be found the facade does nothing.  If the kernel driver cannot
    be detached that's more of a problem and right now the USBThreadedReader throws a big fat
    exception from __init__.
    """

    def __init__(self, vendor=ICHARGER_VENDOR_ID, prod=ICHARGER_PRODUCT_ID):
        self._dev = None
        self._opened = False

        self._lock = threading.Lock()
        self._condition = threading.Condition(self._lock)

        self._last_info_packet_ch1 = None
        self._last_info_packet_ch2 = None
        self._last_response_packets = []

        self._read_thread_exit = False
        self._read_thread = threading.Thread(name="HID Reader", target=self.read_from_icharger)
        self._read_thread.daemon = True

        self.vendor = vendor
        self.product = prod

        try:
            self._dev = hid.device()
            if not testing_control.values.usb_device_present:
                raise ValueError("TEST_FAKE_CANNOT_FIND_DEVICE")

            self._read_thread.start()
        except IOError:
            logger.error("The USB device could not be opened")
            raise

    def __del__(self):
        logger.info("USBThreadedReader - requesting shutdown, joining to reader thread")
        self._read_thread_exit = True
        self._read_thread.join()
        logger.info("USBThreadedReader - shutdown complete")

    @property
    def serial_number(self):
        if self._opened:
            return self._dev.get_serial_number_string()
        return "<device not open - no serial number>"

    @property
    def product_name(self):
        if self._opened:
            return self._dev.get_product_string()
        return "<device not open - no product string>"

    @property
    def is_open(self):
        # INTENTIONAL: no lock - only reading a flag/state
        return self._opened

    @property
    def name(self):
        if self._opened:
            return "iCharger {0}, Serial: {1}".format(self.product_name, self.serial_number)
        return "<device not open - no product name/serial>"

    def open(self):
        if self._dev is not None and not self._opened:
            self._dev.open(self.vendor, self.product)
            self._opened = True
        return self._opened

    def close(self):
        if self._opened:
            self._dev.close()
        self._opened = False

    def reset(self):
        self.close()
        self.open()

    @property
    def timeout(self):
        return 5000

    @timeout.setter
    def timeout(self, new_timeout):
        pass

    @property
    def baudrate(self):
        """As this is a serial facade, we return a totally fake baudrate here"""
        return 19200

    @property
    def valid(self):
        return self._dev is not None

    def reset_input_buffer(self):
        """There are no internal buffers so this method is a no-op"""
        pass

    def reset_output_buffer(self):
        """There are no internal buffers so this method is a no-op"""
        pass

    def write(self, payload):
        if not testing_control.values.usb_device_present:
            raise IOError("FAKE TEST ON WRITE, CHARGER NOT PRESENT")

        if self.valid and self.is_open:
            pad_len = MAX_READWRITE_LEN - len(payload)
            data = struct.pack("B", 0)
            content = list(data + payload + ("\0" * pad_len))

            try:
                return self._dev.write([ord(i) for i in content])
            except Exception, e:
                logger.info("exception on device write, %s", e)
                raise

        raise IOError("Device write failure - either not present or not claimed")

    def read_from_icharger(self):
        a__b_i_t = 0.01

        while not self._read_thread_exit:
            try:
                has_data = False

                # if the USB bus isn't open - try to do so
                if self.valid and not self.is_open:
                    try:
                        self.reset()
                    except IOError:
                        pass

                # if its STILL not open, well hang around a bit and try later
                if self.valid and not self.is_open:
                    time.sleep(a__b_i_t)
                else:
                    int_list = None

                    try:
                        int_list = self._dev.read(MAX_READWRITE_LEN, 1000)

                        if len(int_list) == 64:
                            has_data = True
                        else:
                            with self._condition:
                                self._condition.notify_all()
                    except IOError, i:
                        self.close()
                        time.sleep(a__b_i_t)

                    # is this an info packet?  does it even vaugely resemble something that
                    # we should smuggle out of here?
                    if has_data:
                        with self._condition:
                            if int_list[0] in [40, 44] and int_list[1] == 16:
                                if int_list[2] == 1:
                                    self._last_info_packet_ch1 = int_list
                                    logger.debug("Captured INFO packet for channel 1: {0}".format(int_list[:15]))
                                else:
                                    self._last_info_packet_ch2 = int_list
                                    logger.debug("Captured INFO packet for channel 2: {0}".format(int_list[:15]))
                            elif int_list[1] == 48:
                                self._last_response_packets.append(int_list)
                                logger.debug("Captured REPLY: {0}".format(int_list[:15]))
                            else:
                                logger.debug("Holy crap, what do we have? : {0}".format(int_list))

                            self._condition.notify_all()
            except Exception, e:
                traceback.print_exc(file=sys.stdout)
                logger.warn("the read_from_icharger thread experienced an exception: %s", str(e))

        logger.info("USB reading thread has stopped, _read_thread_exit value is: {0}".format(self._read_thread_exit))

    def read(self, expected_length):
        if not testing_control.values.usb_device_present:
            raise IOError("FAKE TEST ON READ, CHARGER NOT PRESENT")

        TOTAL_TIME_LIMIT = 5.0
        time_spent = 0.0

        while time_spent <= TOTAL_TIME_LIMIT:
            time_started_loop = time.time()

            with self._condition:
                if len(self._last_response_packets) == 0:
                    self._condition.wait(100)

                time_finished_waiting = time.time()
                time_elapsed = time_finished_waiting - time_started_loop
                logger.debug("total time elapsed: {0}".format(time_spent))

                int_list = None
                if len(self._last_response_packets) > 0:
                    int_list = self._last_response_packets.pop()

                time_spent += time_elapsed

            if int_list is not None:
                return array.array('B', int_list[:expected_length]).tostring()

        raise IOError("unable to read response packet from USB device within {0}s".format(TOTAL_TIME_LIMIT))


class iChargerMaster(RtuMaster):
    """
    Modbus master interface to the iCharger, implements higher level routines to get the
    status / channel information from the device.
    """

    def __init__(self, serial=None):
        if serial is None:
            serial = USBThreadedReader()

        super(iChargerMaster, self).__init__(serial)

    def _make_query(self):
        return iChargerQuery()

    def reset(self):
        self._serial.reset()

    def _do_open(self):
        self._serial.open()

    def _do_close(self):
        self._serial.close()

    def modbus_read_registers(self, addr, data_format, function_code=cst.READ_INPUT_REGISTERS):
        """
        Uses the modbus_tk framework to acquire data from the device.

        The data_format specifies the layout of the data being returned and is always
        specified in native format - DO NOT include '>' or '<' as then the byte
        swapping will not work.

        The number of words (2 bytes) of data being returned is calculated as the byte size of
        the return packet / 2, and the total length of data to be read is the total byte size
        + 4 bytes for the header information.  This appears to be a Modbus protocol specific
        decision by Junsi for the iCharger.

        :param addr: the base address (offsets are in words not bytes)
        :param data_format: the structure of the data being received, assumes struct.unpack()
        :return: the tuples of unpacked and byte swapped data
        """
        data_format = "=" + data_format
        byte_len = struct.calcsize(data_format)
        quant = byte_len // 2

        assert (quant * 2) == byte_len

        if testing_control.values.modbus_read_should_fail:
            raise TestingControlException("modbus_read_registers")

        """The slave param (1 in this case) is never used, its appropriate to RTU based Modbus
        devices but as this is iCharger via USB-HID this is irrelevant."""
        return self.execute(1,
                            function_code,
                            addr,
                            data_format=data_format,
                            quantity_of_x=quant,
                            expected_length=(quant * 2) + 4)

    def modbus_write_registers(self, addr, data):
        """
        Writes data using modbus_tk to the modbus slave given an address to write to.
        :param addr: the address to begin writing values at
        :param data: tuple of data to be written - these are int words
        :return:
        """
        return self.execute(1,
                            cst.WRITE_MULTIPLE_REGISTERS,
                            addr,
                            data_format="B",
                            output_value=data,
                            expected_length=4)
