import array
import hid
import logging
import struct

import modbus_tk.defines as cst
from modbus_tk.exceptions import ModbusInvalidRequestError, ModbusInvalidResponseError
from modbus_tk.modbus import Query
from modbus_tk.modbus_rtu import RtuMaster

logger = logging.getLogger('electric.app.{0}'.format(__name__))

MEMORY_MAX = 64
MODBUS_HID_FRAME_TYPE = 0x30

ICHARGER_VENDOR_ID = 0x0483
ICHARGER_PRODUCT_ID = 0x5751

END_POINT_ADDRESS_WRITE = 0x01
END_POINT_ADDRESS_READ = 0x81

MAX_READWRITE_LEN = 64
READ_REG_COUNT_MAX = 30
WRITE_REG_COUNT_MAX = 28


class TestingControlException(Exception):
    pass


class TestingControl:
    def __init__(self):
        self.reset()

    def reset(self):
        # Holds the global testing flags that modify the interface behaviour in simple ways to enable testing
        self.usb_device_present = True
        # If a read operation should fail and throw an exception
        self.modbus_read_should_fail = False
        # If a write operation should fail and throw an exception
        self.modbus_write_should_fail = False


testing_control = TestingControl()

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


def connection_state_dict(exc=None):
    """
    Returns a dict that wraps up the information provided by the exception as well as
    the connection state of the charger
    """

    state = "connected"
    if exc is not None and isinstance(exc, Exception):
        state = "disconnected"

    value = {
        "charger_presence": state
    }

    if exc is not None:
        value.update({"exception": str(exc)})

    return value


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
            self.adu_len = 7 + (self.quantity * 2)
        else:
            raise ModbusInvalidRequestError("Request func code not recognized (code is: {0})".format(self.func_code))

        return struct.pack(">BB", self.adu_len, MODBUS_HID_FRAME_TYPE) + pdu

    def parse_response(self, response):
        if len(response) < 3:
            raise ModbusInvalidResponseError("Response length is invalid {0}".format(len(response)))

        (self.response_length, self.adu_constant, self.response_func_code, self.modbus_error) = \
            struct.unpack("=BBBB", response[0:4])

        if self.adu_constant != MODBUS_HID_FRAME_TYPE:
            raise ModbusInvalidResponseError(
                "Response does not contain the expected frame type constant (0x30) in ADU portion of the result, constant value found is {0}".format(
                    self.adu_constant))

        if self.response_func_code != self.func_code:
            if self.response_func_code == self.func_code | 0x80:
                raise ModbusInvalidResponseError(
                    "Response contains error code {0}: {1}".format(self.modbus_error,
                                                                   self._modbus_error_string(self.modbus_error))
                )

            raise ModbusInvalidResponseError(
                "Response func_code {0} isn't the same as the request func_code {1}".format(
                    self.response_func_code, self.func_code
                ))
        else:
            self.modbus_error = 0

        # primitive byte swap the entire thing... but only if this is the READ INPUT/HOLDING type
        if self.func_code == cst.READ_HOLDING_REGISTERS or self.func_code == cst.READ_INPUT_REGISTERS:
            header = response[2:4]
            data = response[4:]
            response = header + ''.join([c for t in zip(data[1::2], data[::2]) for c in t])
        else:
            response = response[2:]

        return response

    @staticmethod
    def _modbus_error_string(code):
        for err in ModbusErrors:
            if err["v"] == code:
                if "d" in err:
                    return "{0} ({1})".format(err["c"], err["d"])
                return err["c"]

        return "Unknown Code"


class USBSerialFacade:
    """
    Implements facade such that the ModBus Master thinks it is using a serial
    device when talking to the iCharger via USB-HID.

    USBSerialFacade sets the active USB configuration and claims the interface,
    take note - this must be released when the instance is cleaned up / destroyed.  If
    the USB device cannot be found the facade does nothing.  If the kernel driver cannot
    be detached that's more of a problem and right now the USBSerialFacade throws a big fat
    exception from __init__.
    """

    def __init__(self, vendor=ICHARGER_VENDOR_ID, prod=ICHARGER_PRODUCT_ID):
        self._dev = None
        self._opened = False

        self.vendor = vendor
        self.product = prod

        try:
            self._dev = hid.device()
            if not testing_control.usb_device_present:
                raise ValueError("TEST_FAKE_CANNOT_FIND_DEVICE")
        except IOError:
            logging.error("The USB device could not be opened")
            raise

    def reset(self):
        if self._dev is not None:
            self.close()
            self.open()
        return True

    @property
    def serial_number(self):
        if self._opened:
            return self._dev.get_serial_number_string()
        return "<not yet opened - no serial number>"

    @property
    def is_open(self):
        return self._opened

    @property
    def name(self):
        if self._opened:
            return "iCharger 4010 Duo SN:" + self.serial_number
        return "! iCharger Not Connected !"

    def open(self):
        if self._dev is not None:
            self._dev.open(self.vendor, self.product)
            self._opened = True
        return True

    def close(self):
        if self._opened:
            self._dev.close()
        self._opened = False
        return True

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
        if not testing_control.usb_device_present:
            raise IOError("FAKE TEST ON WRITE, CHARGER NOT PRESENT")

        if self._dev is not None:
            pad_len = MAX_READWRITE_LEN - len(payload)
            data = struct.pack("B", 0)
            content = list(data + payload + ("\0" * pad_len))
            try:
                return self._dev.write([ord(i) for i in content])
            except Exception, e:
                logging.info("bad bad bad, %s", e)

        raise IOError("Device write failure - either not present or not claimed")

    def read(self, expected_length):
        if not testing_control.usb_device_present:
            raise IOError("FAKE TEST ON READ, CHARGER NOT PRESENT")

        if self._dev is not None:
            data = self._dev.read(MAX_READWRITE_LEN + 1, 5000)
            return array.array('B', data[:expected_length]).tostring()

        raise IOError("Device read failure - either not present or not claimed")


class iChargerMaster(RtuMaster):
    """
    Modbus master interface to the iCharger, implements higher level routines to get the
    status / channel information from the device.
    """

    def __init__(self, serial=None):
        if serial is None:
            serial = USBSerialFacade()

        super(iChargerMaster, self).__init__(serial)

    def _make_query(self):
        return iChargerQuery()

    def reset(self):
        self._serial.reset()

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

        if testing_control.modbus_read_should_fail:
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
