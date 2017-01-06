import logging
import struct

import usb.util
import usb.core
import platform

from junsi_types import DeviceInfo, ChannelStatus, Control, PresetIndex, Preset

from modbus_tk.exceptions import ModbusInvalidRequestError, ModbusInvalidResponseError
from modbus_tk.modbus import Query
from modbus_tk.modbus_rtu import RtuMaster
import modbus_tk.defines as cst

CHANNEL_INPUT_HEADER_OFFSET = 0
CHANNEL_INPUT_FOOTER_OFFSET = 51
CHANNEL_INPUT_CELL_IR_FORMAT = 35
CHANNEL_INPUT_CELL_BALANCE_OFFSET = 27
CHANNEL_INPUT_CELL_VOLT_OFFSET = 11

# see the helper/main.cpp module I created that tells me these
# offset values more reliably than Mr Blind Man.
SYSTEM_STORAGE_OFFSET_FANS_OFF_DELAY = 5
SYSTEM_STORAGE_OFFSET_CALIBRATION = 22
SYSTEM_STORAGE_OFFSET_CHARGER_POWER = 34

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
        # If the kernel detach should fail
        self.usb_detach_from_kernel_should_fail = False
        # claiming the interface should fail
        self.usb_claim_interface_should_fail = False
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

    value = {
        "charger_presence": "disconnected" if exc is not None else "connected"
    }

    if exc is not None:
        value.update({"exception": str(exc)})

    return value

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
# But you NEED to unplug/plug-in the device for this to work - otherwise REBOOT the device.
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
                    "Response contains error code {0}: {1}".format(self.modbus_error, self._modbus_error_string(self.modbus_error))
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

    def __init__(self, vendorId=ICHARGER_VENDOR_ID, productId=ICHARGER_PRODUCT_ID):
        self._dev = None
        self._claimed = False

        try:
            self._dev = usb.core.find(idVendor=vendorId, idProduct=productId)
            if not testing_control.usb_device_present:
                raise usb.core.NoBackendError("TEST_FAKE_CANNOT_FIND_DEVICE")
        except usb.core.NoBackendError:
            logging.error("There is no USB backend - the service cannot start")
            raise

        if self._dev is None:
            return

        # odd but true, if you remove this then read/writes to the USB bus while the
        # charger is actually doing its charge/discharge job WILL FAIL on the PI3
        self._dev.reset()

        if platform.system() != "Windows":
            self._detach_kernel_driver()

    def _detach_kernel_driver(self):
        if self._dev is None or testing_control.usb_detach_from_kernel_should_fail:
            raise usb.core.USBError("Failed to detach from the kernel")

        if self._dev.is_kernel_driver_active(0):
            self._dev.detach_kernel_driver(0)

    def _claim_interface(self):
        if not self._dev or testing_control.usb_claim_interface_should_fail:
            raise usb.core.USBError("Must be able to claim the interface or read/write won't work - perhaps the device is not plugged in or not turned on?")

        try:
            usb.util.claim_interface(self._dev, 0)
            self._claimed = True
            return True
        except Exception, e:
            logging.info("Failed to _claim interface with {0}".format(e))
        return False

    def _release_interface(self):
        if not self._dev:
            return False

        try:
            usb.util.release_interface(self._dev, 0)
            self._claimed = False
            return True
        except:
            pass
        return False

    @property
    def serial_number(self):
        return usb.util.get_string(self._dev, self._dev.iSerialNumber) if self.valid else None

    @property
    def is_open(self):
        return self._dev is not None and self._claimed

    @property
    def name(self):
        if self.serial_number is not None:
            return "iCharger 4010 Duo SN:" + self.serial_number
        return "! iCharger Not Connected !"

    def open(self):
        return self._claim_interface()

    def close(self):
        return self._release_interface()

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

    def write(self, content):
        if self._dev is not None and self._claimed:
            pad_len = MAX_READWRITE_LEN - len(content)
            return self._dev.write(END_POINT_ADDRESS_WRITE, content + ("\0" * pad_len), 5000)
        raise usb.core.USBError("Device write failure - either not present or not claimed")

    def read(self, expected_length):
        if self._dev is not None and self._claimed:
            return self._dev.read(END_POINT_ADDRESS_READ, expected_length, 5000).tostring()
        raise usb.core.USBError("Device read failure - either not present or not claimed")


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

    def _modbus_read_registers(self, addr, format, function_code = cst.READ_INPUT_REGISTERS):
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
        :param format: the structure of the data being received, assumes struct.unpack()
        :return: the tuples of unpacked and byte swapped data
        """
        format = "=" + format
        byte_len = struct.calcsize(format)
        quant = byte_len // 2

        assert (quant * 2) == byte_len

        if testing_control.modbus_read_should_fail:
            raise TestingControlException("_modbus_read_registers")

        """The slave param (1 in this case) is never used, its appropriate to RTU based Modbus
        devices but as this is iCharger via USB-HID this is irrelevant."""
        return self.execute(1,
                            function_code,
                            addr,
                            data_format=format,
                            quantity_of_x=quant,
                            expected_length=(quant * 2) + 4)

    def _modbus_write_registers(self, addr, data):
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

    def get_device_info(self):
        """
        Returns the following information from the iCharger, known as the 'device only reads message'
        :return: a DeviceInfo instance
        """
        return DeviceInfo(self._modbus_read_registers(0x000, format="h12sHHHHHH"))

    def get_channel_status(self, channel):
        """"
        Returns the following information from the iCharger, known as the 'channel input read only' message:
        :return: ChannelStatus instance
        """

        addr = 0x100 if channel == 0 else 0x200

        # timestamp -> ext temp
        header_fmt = "LlhHHlhh"
        header_data = self._modbus_read_registers(addr, header_fmt)

        # cell 0-15 voltage
        cell_volt_fmt = "16H"
        cell_volt_addr = addr + CHANNEL_INPUT_CELL_VOLT_OFFSET
        cell_volt = self._modbus_read_registers(cell_volt_addr, cell_volt_fmt)

        # cell 0-15 balance
        cell_balance_fmt = "16B"
        cell_balance_addr = addr + CHANNEL_INPUT_CELL_BALANCE_OFFSET
        cell_balance = self._modbus_read_registers(cell_balance_addr, cell_balance_fmt)

        # cell 0-15 IR
        cell_ir_fmt = "16H"
        cell_ir_addr = addr + CHANNEL_INPUT_CELL_IR_FORMAT
        cell_ir = self._modbus_read_registers(cell_ir_addr, cell_ir_fmt)

        # total IR -> dialog box ID
        footer_fmt = "7H"
        footer_addr = addr + CHANNEL_INPUT_FOOTER_OFFSET
        footer = self._modbus_read_registers(footer_addr, footer_fmt)

        return ChannelStatus(channel, header_data, cell_volt, cell_balance, cell_ir, footer)

    def get_control_register(self):
        "Returns the current run state of a particular channel"
        return Control(self._modbus_read_registers(0x8000, "7H", function_code=cst.READ_HOLDING_REGISTERS))

    def _beep_summary_dict(self, enabled, volume, type):
        return {
            "enabled": enabled,
            "volume": volume,
            "type": type
        }

    def _power_priority_description(self, pri):
        if pri == 0:
            return "average"
        if pri == 1:
            return "ch1 priority"
        if pri == 2:
            return "ch2 priority"

    def set_beep_properties(self, beep_index = 0, enabled = True, volume = 5):
        # for now we only access beep type values
        base = 0x8400

        results = self._modbus_read_registers(base + 13, "8H", function_code=cst.READ_HOLDING_REGISTERS)

        value_enabled = list(results[:4])
        value_volume = list(results[4:])

        value_enabled[beep_index] = int(enabled)
        value_volume[beep_index] = volume

        return self._modbus_write_registers(base + 13, value_enabled + value_volume)

    def set_active_channel(self, channel):
        base = 0x8000 + 2
        if channel not in (0, 1):
            return None
        return self._modbus_write_registers(base, (channel,))

    def get_system_storage(self):
        """Returns the system storage area of the iCharger"""
        base = 0x8400
        (temp_unit, temp_stop, temp_fans_on, temp_reduce, dummy1) \
            = self._modbus_read_registers(base, "5H", function_code=cst.READ_HOLDING_REGISTERS)

        addr = base + SYSTEM_STORAGE_OFFSET_FANS_OFF_DELAY
        (fans_off_delay, lcd_contrast, light_value, dump2, beep_type_key, beep_type_hint, beep_type_alarm,
         beep_type_done, beep_enable_key, beep_enable_hint, beep_enable_alarm, beep_enable_done,
         beep_vol_key, beep_vol_hint, beep_vol_alarm, beep_vol_done, dummy3) \
            = self._modbus_read_registers(addr, "17H", function_code=cst.READ_HOLDING_REGISTERS)

        addr = base + SYSTEM_STORAGE_OFFSET_CALIBRATION
        (calibration, dump4, sel_input_device, dc_inp_low_volt, dc_inp_over_volt, dc_inp_curr_limit,
         batt_inp_low_volt, batt_inp_over_volt, batt_input_curr_limit, regen_enable, regen_volt_limit,
         regen_curr_limit) = \
            self._modbus_read_registers(addr, "12H", function_code=cst.READ_HOLDING_REGISTERS)

        addr = base + SYSTEM_STORAGE_OFFSET_CHARGER_POWER
        (charger_power_0, charger_power_1, discharge_power_0, discharge_power_1, power_priority,
         logging_sample_interval_0, logging_sample_interval_1,
         logging_save_to_sdcard_0, logging_save_to_sdcard_1,
         servo_type, servo_user_center, servo_user_rate, servo_op_angle) = \
            self._modbus_read_registers(addr, "13H", function_code=cst.READ_HOLDING_REGISTERS)

        return {
            "temp_unit": "C" if temp_unit == 0 else "F",
            "temp_stop": temp_stop / 10.0,
            "temp_fans_on": temp_fans_on / 10.0,
            "temp_reduce": temp_reduce / 10.0,
            "fans_off_delay": fans_off_delay,
            "lcd_contrast": lcd_contrast,
            "light_value": light_value,
            "beep": {
                "key": self._beep_summary_dict(beep_enable_key, beep_vol_key, beep_type_key),
                "hint": self._beep_summary_dict(beep_enable_hint, beep_vol_hint, beep_type_hint),
                "alarm": self._beep_summary_dict(beep_enable_alarm, beep_vol_alarm, beep_type_alarm),
                "done": self._beep_summary_dict(beep_enable_done, beep_vol_done, beep_type_done)
            },
            "calibration": calibration,
            "selected_input_device": sel_input_device,
            "selected_input_device_type": "dc" if sel_input_device == 0 else "battery",
            "dc_input": {
                "low_volt": dc_inp_low_volt,
                "over_volt": dc_inp_over_volt,
                "curr_limit": dc_inp_curr_limit,
            },
            "batt_input": {
                "low_volt": batt_inp_low_volt,
                "over_volt": batt_inp_over_volt,
                "curr_limit": batt_input_curr_limit
            },
            "regeneration": {
                "enabled": regen_enable,
                "curr_limit": regen_curr_limit,
                "volt_limit": regen_volt_limit
            },
            "charger_power": [
                charger_power_0,
                charger_power_1
            ],
            "discharge_power": [
                discharge_power_0,
                discharge_power_1
            ],
            "power_priority": power_priority,
            "power_priority_desc": self._power_priority_description(power_priority),
            "logging_sample_interval": [
                logging_sample_interval_0,
                logging_sample_interval_1
            ],
            "logging_save_to_sdcard": [
                logging_save_to_sdcard_0,
                logging_save_to_sdcard_1
            ],
            "servo": {
                "type": servo_type,
                "user_center": servo_user_center,
                "user_rate": servo_user_rate,
                "op_angle": servo_op_angle
            }
        }

    def get_preset_list(self):
        (count, ) = self._modbus_read_registers(0x8800, "H", function_code=cst.READ_HOLDING_REGISTERS)

        number = count
        offset = 0
        indexes = ()

        while(count > 0):
            to_read = min(count, 2)
            if (to_read % 2) != 0:
                to_read += 1
            data = self._modbus_read_registers(0x8801 + offset, "{0}B".format(to_read), function_code=cst.READ_HOLDING_REGISTERS)
            count -= len(data)
            indexes += data
            offset += len(data) / 2

        return PresetIndex(number, indexes[:number])