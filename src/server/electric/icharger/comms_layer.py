import logging

import modbus_tk.defines as cst

from electric.icharger.models import SystemStorage, WriteDataSegment, OperationResponse
from modbus_usb import iChargerMaster
from models import DeviceInfo, ChannelStatus, Control, PresetIndex, Preset, ReadDataSegment

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

logger = logging.getLogger('electric.app.{0}'.format(__name__))

VALUE_ORDER_LOCK = 0x55aa


class Operation:
    Charge = 0
    Storage = 1
    Discharge = 2
    Cycle = 3
    Balance = 4


class Order:
    Stop = 0
    Run = 1
    Modify = 2
    WriteSys = 3
    WriteMemHead = 4
    WriteMem = 5
    TransLogOn = 6
    TransLogOff = 7
    MsgBoxYes = 8
    MsgBoxNo = 9


class ChargerCommsManager(object):
    """
    The comms manager is responsible for data translation between the MODBUS types and the world outside.  It uses an
    instance of the modbus capable read/write routines to fetch and modify charger parameters.  It co-ordinates
    multiple modbus segment reads/writes where required.

    Validation is not performed here - the data going in/out is assumed to be correct already.
    """
    locking = False

    def __init__(self, master=None):
        if master is None:
            master = iChargerMaster()
        self.charger = master

    def reset(self):
        self.charger.reset()

    def get_device_info(self):
        """
        Returns the following information from the iCharger, known as the 'device only reads message'
        :return: a DeviceInfo instance
        """
        vars = ReadDataSegment(self.charger, "vars", "h12sHHHHHH", base=0x0000)
        return DeviceInfo(vars.data)

    def get_channel_status(self, channel, device_id=None):
        """"
        Returns the following information from the iCharger, known as the 'channel input read only' message:
        :return: ChannelStatus instance
        """
        addr = 0x100 if channel == 0 else 0x200

        # timestamp -> ext temp
        header_fmt = "LlhHHlhh"
        header_data = self.charger.modbus_read_registers(addr, header_fmt)

        # cell 0-15 voltage
        cell_volt_fmt = "16H"
        cell_volt_addr = addr + CHANNEL_INPUT_CELL_VOLT_OFFSET
        cell_volt = self.charger.modbus_read_registers(cell_volt_addr, cell_volt_fmt)

        # cell 0-15 balance
        cell_balance_fmt = "16B"
        cell_balance_addr = addr + CHANNEL_INPUT_CELL_BALANCE_OFFSET
        cell_balance = self.charger.modbus_read_registers(cell_balance_addr, cell_balance_fmt)

        # cell 0-15 IR
        cell_ir_fmt = "16H"
        cell_ir_addr = addr + CHANNEL_INPUT_CELL_IR_FORMAT
        cell_ir = self.charger.modbus_read_registers(cell_ir_addr, cell_ir_fmt)

        # total IR -> dialog box ID
        footer_fmt = "7H"
        footer_addr = addr + CHANNEL_INPUT_FOOTER_OFFSET
        footer = self.charger.modbus_read_registers(footer_addr, footer_fmt)

        return ChannelStatus(device_id, channel, header_data, cell_volt, cell_balance, cell_ir, footer)

    def get_control_register(self):
        "Returns the current run state of a particular channel"
        return Control(self.charger.modbus_read_registers(0x8000, "7H", function_code=cst.READ_HOLDING_REGISTERS))

    def _beep_summary_dict(self, enabled, volume, type):
        return {
            "enabled": enabled,
            "volume": volume,
            "type": type
        }

    def set_beep_properties(self, beep_index=0, enabled=True, volume=5):
        # for now we only access beep type values
        base = 0x8400

        results = ReadDataSegment(self.charger, "temp", "8H", base=0x8400 + 13)
        value_enabled = list(results.data[:4])
        value_volume = list(results.data[4:])

        value_enabled[beep_index] = int(enabled)
        value_volume[beep_index] = volume

        return self.charger.modbus_write_registers(base + 13, value_enabled + value_volume)

    def set_active_channel(self, channel):
        base = 0x8000 + 2
        if channel not in (0, 1):
            return None
        return self.charger.modbus_write_registers(base, (channel,))

    def get_system_storage(self):
        """Returns the system storage area of the iCharger"""
        # temp-unit -> beep-vol
        ds1 = ReadDataSegment(self.charger, "vars1", "21H", base=0x8400)
        # dump3 -> reg current limit
        ds2 = ReadDataSegment(self.charger, "vars2", "13H", prev_format=ds1)
        # charge/discharge power -> modbus_serial_parity
        ds3 = ReadDataSegment(self.charger, "vars3", "17H", prev_format=ds2)

        return SystemStorage(ds1, ds2, ds3)

    def _get_memory_program_preset_index(self, index):
        preset_list = self.get_preset_list()
        if index > preset_list.count - 1:
            raise ValueError("Preset index too large")
        return preset_list.indexes[index]

    def select_memory_program(self, preset_index):
        control = self.get_control_register()
        return self.charger.modbus_write_registers(0x8000 + 1,
                                                   (preset_index, control.channel, VALUE_ORDER_LOCK))

    def get_preset_list(self, count_only=False):
        (count,) = self.charger.modbus_read_registers(0x8800, "H", function_code=cst.READ_HOLDING_REGISTERS)
        if count_only:
            return count

        number = count
        offset = 0
        indexes = ()

        while count > 0:
            to_read = min(count, 32)
            if (to_read % 2) != 0:
                to_read += 1
            data = self.charger.modbus_read_registers(0x8801 + offset, "{0}B".format(to_read),
                                                      function_code=cst.READ_HOLDING_REGISTERS)
            count -= len(data)
            indexes += data
            offset += len(data) / 2

        return PresetIndex(number, indexes[:number])

    def get_preset(self, index):
        preset_index = self._get_memory_program_preset_index(index)
        self.select_memory_program(preset_index)

        # use-flag -> channel mode
        vars1 = ReadDataSegment(self.charger, "vars1", "H38sLBB7cHB", base=0x8c00)
        # save to sd -> bal-set-point
        vars2 = ReadDataSegment(self.charger, "vars2", "BHH12BHBBB", prev_format=vars1)
        # bal-delay, keep-charge-enable -> reg discharge mode
        vars3 = ReadDataSegment(self.charger, "vars3", "BB14H", prev_format=vars2)
        # ni-peak -> cycle-delay
        vars4 = ReadDataSegment(self.charger, "vars4", "16H", prev_format=vars3)
        # cycle-mode -> ni-zn-cell
        vars5 = ReadDataSegment(self.charger, "vars5", "B6HB2HB3HB", prev_format=vars4)

        return Preset.modbus(index, vars1, vars2, vars3, vars4, vars5)

    def set_preset(self, preset):
        preset_index = self._get_memory_program_preset_index(preset.index)
        self.select_memory_program(preset_index)

        # ask the preset for its data segments
        (v1, v2, v3, v4, v5) = preset.to_modbus_data()

        s1 = WriteDataSegment(self.charger, "seg1", v1, "H38sLBB7cHB", base=0x8c00)
        s2 = WriteDataSegment(self.charger, "seg2", v2, "BHH12BHBBB", prev_format=s1)
        s3 = WriteDataSegment(self.charger, "seg3", v3, "BB14H", prev_format=s2)
        s4 = WriteDataSegment(self.charger, "seg3", v4, "16H", prev_format=s3)
        s5 = WriteDataSegment(self.charger, "seg3", v5, "B6HB2HB3HB", prev_format=s4)

        return True

    def unlock_after_write(self):
        # clear the ORDER LOCK value (no idea why - the C++ code does this)
        self.charger.modbus_write_registers(0x8000 + 3, (0,))

    def close_messagebox(self):
        # If showing a dialog, or have error, try to clear the dialog
        self.charger.modbus_write_registers(0x8000 + 3, (VALUE_ORDER_LOCK, Order.MsgBoxNo, 0, 0,))
        self.unlock_after_write()

    def stop_operation(self, channel_number):
        channel_number = min(1, max(0, channel_number))
        values_list = (channel_number, VALUE_ORDER_LOCK, Order.Stop, 0, 0,)

        modbus_response = self.charger.modbus_write_registers(0x8000 + 2, values_list)
        logger.info("Got back {0} from write".format(modbus_response))
        status = self.get_device_info().get_status(channel_number)
        logger.info("Device status: {0}".format(status.to_native()))
        self.unlock_after_write()

        # If showing a dialog, or have error, try to clear the dialog
        # This also works to close the presets listing, if that is open
        if status.dlg_box_status or status.err:
            logger.info("Have dialog showing, attempting to close dialog")
            self.close_messagebox()

        return OperationResponse(modbus_response)

    def run_operation(self, operation, channel_number, preset_index):
        channel_number = min(1, max(0, channel_number))

        # Translate from a sensible 0..64 index, to where it is in memory
        memory_index = self._get_memory_program_preset_index(preset_index)
        logger.info("Preset index {0} is at memory slot {1}".format(preset_index, memory_index))

        values_list = (
            operation,
            memory_index,
            channel_number,
            VALUE_ORDER_LOCK,
            Order.Run,
        )

        logger.info("Sending write: {0}".format(values_list))
        modbus_response = self.charger.modbus_write_registers(0x8000, values_list)
        logger.info("Got back {0} from write".format(modbus_response))
        logger.info("Device status: {0}".format(self.get_device_info().get_status(channel_number).to_native()))

        self.unlock_after_write()

        return OperationResponse(modbus_response)
