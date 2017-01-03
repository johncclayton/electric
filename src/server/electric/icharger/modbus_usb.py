import logging
import struct
import sys

import modbus_tk.defines as cst
import usb.core
import usb.util

from modbus_tk.exceptions import ModbusInvalidRequestError, ModbusInvalidResponseError
from modbus_tk.modbus import Query
from modbus_tk.modbus_rtu import RtuMaster

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

STATUS_RUN = 0x01
STATUS_ERROR = 0x02
STATUS_CONTROL_STATUS = 0x04
STATUS_RUN_STATUS = 0x08
STATUS_DLG_BOX_STATUS = 0x10
STATUS_CELL_VOLTAGE = 0x20
STATUS_BALANCE = 0x40

Control_RunOperations = [
    (0, "charge"),
    (1, "storage"),
    (2, "discharge"),
    (3, "cycle"),
    (4, "balance only"),
]

Control_OrderOperations = [
    (0, "run"),
    (1, "modify"),
    (2, "write system"),
    (3, "write memory head"),
    (4, "write memory"),
    (5, "trans log on"),
    (6, "trans log off"),
    (7, "msgbox yes"),
    (8, "msgbox no")
]

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


def exception_dict(exc):
    """
    Returns a dict that wraps up the information provided by the exception as well as
    the connection state of the charger
    """
    return {
        "exception": str(exc),
        "charger_presence": "disconnected"
    }


#
#
# relies on the following going into /etc/udev/rules.d/10-icharger4010.rules
#
# apply user land permissions so we don't require root to read/write it
# SUBSYSTEMS=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5751", MODE:="0666"
#
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

        # check for max length problem, the iCharger HID based Modbus protocol handles only
        # 64 byte packets.  If you want to read more, then send multiple read requests.
        (self.response_length, self.adu_constant, self.response_func_code) = struct.unpack(">BBB", response[0:3])

        if self.adu_constant != MODBUS_HID_FRAME_TYPE:
            raise ModbusInvalidResponseError(
                "Response does not contain the expected frame type constant (0x30) in ADU portion of the result, constant value found is {0}".format(
                    self.adu_constant))

        if self.response_func_code != self.func_code:
            raise ModbusInvalidResponseError(
                "Response func_code {0} isn't the same as the request func_code {1}".format(
                    self.response_func_code, self.func_code
                ))

        # primitive byte swap the entire thing...
        header = response[2:4]
        data = response[4:]
        return header + ''.join([c for t in zip(data[1::2], data[::2]) for c in t])


class iChargerUSBSerialFacade:
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
        self._cfg = None

        try:
            self._dev = usb.core.find(idVendor=vendorId, idProduct=productId)
        except usb.core.NoBackendError:
            logging.error("There is no USB backend - the service cannot start")
            raise

        if self._dev is None:
            return

        if not self._detach_kernel_driver():
            logging.error("Failed to detach from the kernel")
            sys.exit("failed to detach kernel driver")

        self._cfg = self._dev.get_active_configuration()
        if self._cfg is None:
            logging.error("No active USB configuration for the iCharger was found")

    def _detach_kernel_driver(self):
        if self._dev.is_kernel_driver_active(0):
            try:
                self._dev.detach_kernel_driver(0)
            except usb.core.USBError as e:
                return False
        return True

    def _claim_interface(self):
        if not self._dev:
            return False

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
            self._dev.write(END_POINT_ADDRESS_WRITE, content + ("\0" * pad_len))
        return 0

    def read(self, expected_length):
        if self._dev is not None and self._claimed:
            return self._dev.read(END_POINT_ADDRESS_READ, expected_length).tostring()
        return 0


class iChargerMaster(RtuMaster):
    """
    Modbus master interface to the iCharger, implements higher level routines to get the
    status / channel information from the device.
    """

    def __init__(self, serial=None):
        if serial is None:
            serial = iChargerUSBSerialFacade()
        super(iChargerMaster, self).__init__(serial)

    def _make_query(self):
        return iChargerQuery()

    def _modbus_read_registers(self, addr, format):
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
        byte_len = struct.calcsize(format)
        quant = byte_len // 2

        assert (quant * 2) == byte_len

        """The slave param (1 in this case) is never used, its appropriate to RTU based Modbus
        devices but as this is iCharger via USB-HID this is irrelevant."""
        return self.execute(1,
                            cst.READ_INPUT_REGISTERS,
                            addr,
                            data_format=format,
                            quantity_of_x=quant,
                            expected_length=(quant * 2) + 4)

    def _modbus_write_registers(self, addr, format, data):
        """
        Writes data using modbus_tk to the modbus slave given an address to write to.
        :param addr: the address to begin writing values at
        :param format: the data format to write - don't specify byte order here, just the format
        :param data: tuple of data to be written - these are integers (words)
        :return:
        """
        byte_len = struct.calcsize(format)

        quant = byte_len // 2
        assert (quant * 2) == byte_len

        return self.execute(1,
                            cst.WRITE_MULTIPLE_REGISTERS,
                            addr,
                            data_format=format,
                            output_value=data,
                            expected_length=(quant * 2) + 4)

    def _status_word_as_dict(self, status):
        return {
            "run": status & STATUS_RUN,
            "err": status & STATUS_ERROR,
            "ctrl_status": status & STATUS_CONTROL_STATUS,
            "run_status": status & STATUS_RUN_STATUS,
            "dlg_box_status": status & STATUS_DLG_BOX_STATUS,
            "cell_volt_status": status & STATUS_CELL_VOLTAGE,
            "balance": status & STATUS_BALANCE
        }

    def get_device_info(self):
        """
        Returns the following information from the iCharger, known as the 'device only reads message'
        :return: a tuple containing the response of 'device reads only message'
        Device ID (u16)
        Device SN (S8[12])
        Software Version (u16)
        Hardware Version (u16)
        SYSTEM length (u16 - see also SYSTEM storage area)
        MEMORY length (u16)
        ch1 status word (u16)
        ch2 status word (u16)

        The channel 1/2 status words following this bit-mask:
        Bit0-run flag
        Bit1-error flag
        Bit2-control status flag
        Bit3-run status flag
        Bit4-dialog box status flag
        Bit5-cell voltage flag
        Bit6-balance flag
        """
        try:
            data = self._modbus_read_registers(0x000, format="h12sHHHHHH")

            return {
                "device_id": data[0],
                "device_sn": data[1],
                "software_ver": data[2],
                "hardware_ver": data[3],
                "system_len": data[4],
                "memory_len": data[5],
                "channel_count": 2,
                "ch1_status": self._status_word_as_dict(data[6]),
                "ch2_status": self._status_word_as_dict(data[7]),
                "charger_presence": "connected"
            }
        except Exception, me:
            return exception_dict(me)

    def _cell_status_summary_as_dict(self, cell, voltage, balance, ir):
        if voltage == 1024:
            # 1024 appears to be a dummy value for either unused cells or just not plugged in
            voltage = 0

        return {
            "cell": cell,
            "v": voltage / 1000.0,
            "balance": balance,
            "ir": ir
        }

    def get_channel_status(self, channel):
        """"
        Returns the following information from the iCharger, known as the 'channel input read only' message:
        :return:
        0 Timestamp (u32)
        1 The current output power (u32)
        2 The current output current (s16)
        3 The current input voltage (u16)
        4 The current output voltage (u16)
        5 The current output capacity (s32)
        6 The current internal temp (s16)
        7 The current external temp (s16)
        Cell 0-15 voltage (each is u16, 4010DUO uses only first 10)
        Cell 0-15 balance status (each is u8, 4010DUO uses only first 10)
        Cell 0-15 internal resistance (each is u16, 4010DUO uses only first 10)
        The cells total IR (u16)
        Cycle count (u16)
        Control status (u16)
        Run status (u16)
        Run error (u16)
        Dialog Box ID (u16)
        """

        addr = 0x100 if channel == 1 else 0x200

        try:
            # timestamp -> ext temp
            header_fmt = "LLhHHlhh"
            header_data = self._modbus_read_registers(addr, format=header_fmt)

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

            return {
                "channel": channel,
                "timestamp": header_data[0],
                "curr_out_power": header_data[1],
                "curr_out_amps": header_data[2],
                "curr_inp_volts": header_data[3] / 1000.0,
                "curr_out_volts": header_data[4] / 1000.0,
                "curr_out_capacity": header_data[5],
                "curr_int_temp": header_data[6] / 1000.0,
                "curr_ext_temp": header_data[7] / 1000.0,

                "cells": [
                    self._cell_status_summary_as_dict(str(i), cell_volt[i], cell_balance[i], cell_ir[i]) for i in
                    range(0, 9)
                    ],

                "cell_total_ir": footer[0],
                "line_intern_resistance": footer[1],
                "cycle_count": footer[2],
                "control_status": footer[3],
                "run_status": footer[4],
                "run_error": footer[5],
                "dlg_box_id": footer[6],
                "charger_presence": "connected"
            }

        except Exception, you:
            return exception_dict(you)

    @staticmethod
    def op_description(op):
        for (num, name) in Control_RunOperations:
            if op == num:
                return name
        return None

    @staticmethod
    def order_description(order):
        for (num, name) in Control_OrderOperations:
            if order == num:
                return name
        return None

    def get_control_register(self):
        "Returns the current run state of a particular channel"
        addr = 0x8000
        (op, memory, channel, order_lock, order, limit_current, limit_volt) = \
            self._modbus_read_registers(addr, "7H")

        return {
            "op": op,
            "op_description": self.op_description(op),
            "memory": memory,
            "channel": channel,
            "order_lock": order_lock,
            "order": order,
            "order_description": self.order_description(order),
            "limit_current": limit_current / 1000.0,
            "limit_volt": limit_volt / 1000.0
        }

    def _beep_summary_dict(self, enabled, volume, type):
        return {
            "enabled": enabled,
            "volume": volume,
            "type": type
        }

    def _power_priority_description(self, pri):
        if pri == 0:
            "average"
        if pri == 1:
            return "ch1 priority"
        if pri == 2:
            return "ch2 priority"

    def get_system_storage(self):
        """Returns the system storage area of the iCharger"""
        base = 0x8400
        (temp_unit, temp_stop, temp_fans_on, temp_reduce, dummy1) \
            = self._modbus_read_registers(base, "5H")

        addr = base + SYSTEM_STORAGE_OFFSET_FANS_OFF_DELAY
        (fans_off_delay, lcd_contrast, light_value, dump2, beep_type_key, beep_type_hint, beep_type_alarm,
         beep_type_done, beep_enable_key, beep_enable_hint, beep_enable_alarm, beep_enable_done,
         beep_vol_key, beep_vol_hint, beep_vol_alarm, beep_vol_done, dummy3) \
            = self._modbus_read_registers(addr, "17H")

        addr = base + SYSTEM_STORAGE_OFFSET_CALIBRATION
        (calibration, dump4, sel_input_device, dc_inp_low_volt, dc_inp_over_volt, dc_inp_curr_limit,
         batt_inp_low_volt, batt_inp_over_volt, batt_input_curr_limit, regen_enable, regen_volt_limit,
         regen_curr_limit) = \
            self._modbus_read_registers(addr, "12H")

        addr = base + SYSTEM_STORAGE_OFFSET_CHARGER_POWER
        (charger_power_0, charger_power_1, discharge_power_0, discharge_power_1, power_priority,
         logging_sample_interval, logging_save_to_sdcard, servo_type, servo_user_center, servo_user_rate,
         servo_op_angle) = \
            self._modbus_read_registers(addr, "11H")

        return {
            "temp_unit": "C" if temp_unit == 0 else "F",
            "temp_stop": temp_stop,
            "temp_fans_on": temp_fans_on,
            "temp_reduce": temp_reduce,
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
            "logging_sample_interval": logging_sample_interval,
            "logging_save_to_sdcard": logging_save_to_sdcard,
            "servo": {
                "type": servo_type,
                "user_center": servo_user_center,
                "user_rate": servo_user_rate,
                "op_angle": servo_op_angle
            }
        }
