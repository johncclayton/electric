from icharger.junsi_types import SystemStorage
from junsi_types import DeviceInfo, ChannelStatus, Control, PresetIndex, Preset, DataSegment

import modbus_tk.defines as cst
from modbus_usb import iChargerMaster

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


class iChargerGateway:
    """
    The gateway is responsible for data translation between the MODBUS types and the world outside.  It uses an
    instance of the modbus capable read/write routines to fetch and modify charger parameters, perform write validate
    and properly segment reads/writes where required.
    """
    def __init__(self, master=None):
        if master is None:
            master = iChargerMaster()
        self.charger = master

    def get_device_info(self):
        """
        Returns the following information from the iCharger, known as the 'device only reads message'
        :return: a DeviceInfo instance
        """
        vars = DataSegment(self.charger, "vars", "h12sHHHHHH", base=0x0000)
        return DeviceInfo(vars.data)

    def get_channel_status(self, channel):
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

        return ChannelStatus(channel, header_data, cell_volt, cell_balance, cell_ir, footer)

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

        results = DataSegment(self.charger, "temp", "8H", base=0x8400 + 13)
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
        ds1 = DataSegment(self.charger, "vars1", "21H", base=0x8400)
        # dump3 -> reg current limit
        ds2 = DataSegment(self.charger, "vars2", "13H", prev_format=ds1)
        # charge/discharge power -> modbus_serial_parity
        ds3 = DataSegment(self.charger, "vars3", "17H", prev_format=ds2)

        return SystemStorage(ds1, ds2, ds3)

        # base = 0x8400
        #
        # (temp_unit, temp_stop, temp_fans_on, temp_reduce, dummy1) \
        #     = self.charger.modbus_read_registers(base, "5H", function_code=cst.READ_HOLDING_REGISTERS)
        #
        # addr = base + SYSTEM_STORAGE_OFFSET_FANS_OFF_DELAY
        # (fans_off_delay, lcd_contrast, light_value, dump2, beep_type_key, beep_type_hint, beep_type_alarm,
        #  beep_type_done, beep_enable_key, beep_enable_hint, beep_enable_alarm, beep_enable_done,
        #  beep_vol_key, beep_vol_hint, beep_vol_alarm, beep_vol_done, dummy3) \
        #     = self.charger.modbus_read_registers(addr, "17H", function_code=cst.READ_HOLDING_REGISTERS)
        #
        # addr = base + SYSTEM_STORAGE_OFFSET_CALIBRATION
        # (calibration, dump4, sel_input_device, dc_inp_low_volt, dc_inp_over_volt, dc_inp_curr_limit,
        #  batt_inp_low_volt, batt_inp_over_volt, batt_input_curr_limit, regen_enable, regen_volt_limit,
        #  regen_curr_limit) = \
        #     self.charger.modbus_read_registers(addr, "12H", function_code=cst.READ_HOLDING_REGISTERS)
        #
        # addr = base + SYSTEM_STORAGE_OFFSET_CHARGER_POWER
        # (charger_power_0, charger_power_1, discharge_power_0, discharge_power_1, power_priority,
        #  logging_sample_interval_0, logging_sample_interval_1,
        #  logging_save_to_sdcard_0, logging_save_to_sdcard_1,
        #  servo_type, servo_user_center, servo_user_rate, servo_op_angle) = \
        #     self.charger.modbus_read_registers(addr, "13H", function_code=cst.READ_HOLDING_REGISTERS)
        #
        # return {
        #     "temp_unit": "C" if temp_unit == 0 else "F",
        #     "temp_stop": temp_stop / 10.0,
        #     "temp_fans_on": temp_fans_on / 10.0,
        #     "temp_reduce": temp_reduce / 10.0,
        #     "fans_off_delay": fans_off_delay,
        #     "lcd_contrast": lcd_contrast,
        #     "light_value": light_value,
        #     "beep": {
        #         "key": self._beep_summary_dict(beep_enable_key, beep_vol_key, beep_type_key),
        #         "hint": self._beep_summary_dict(beep_enable_hint, beep_vol_hint, beep_type_hint),
        #         "alarm": self._beep_summary_dict(beep_enable_alarm, beep_vol_alarm, beep_type_alarm),
        #         "done": self._beep_summary_dict(beep_enable_done, beep_vol_done, beep_type_done)
        #     },
        #     "calibration": calibration,
        #     "selected_input_device": sel_input_device,
        #     "selected_input_device_type": "dc" if sel_input_device == 0 else "battery",
        #     "dc_input": {
        #         "low_volt": dc_inp_low_volt,
        #         "over_volt": dc_inp_over_volt,
        #         "curr_limit": dc_inp_curr_limit,
        #     },
        #     "batt_input": {
        #         "low_volt": batt_inp_low_volt,
        #         "over_volt": batt_inp_over_volt,
        #         "curr_limit": batt_input_curr_limit
        #     },
        #     "regeneration": {
        #         "enabled": regen_enable,
        #         "curr_limit": regen_curr_limit,
        #         "volt_limit": regen_volt_limit
        #     },
        #     "charger_power": [
        #         charger_power_0,
        #         charger_power_1
        #     ],
        #     "discharge_power": [
        #         discharge_power_0,
        #         discharge_power_1
        #     ],
        #     "power_priority": power_priority,
        #     "power_priority_desc": self._power_priority_description(power_priority),
        #     "logging_sample_interval": [
        #         logging_sample_interval_0,
        #         logging_sample_interval_1
        #     ],
        #     "logging_save_to_sdcard": [
        #         logging_save_to_sdcard_0,
        #         logging_save_to_sdcard_1
        #     ],
        #     "servo": {
        #         "type": servo_type,
        #         "user_center": servo_user_center,
        #         "user_rate": servo_user_rate,
        #         "op_angle": servo_op_angle
        #     }
        # }

    def get_preset_list(self):
        (count,) = self.charger.modbus_read_registers(0x8800, "H", function_code=cst.READ_HOLDING_REGISTERS)

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
        # use-flag -> channel mode
        vars1 = DataSegment(self.charger, "vars1", "H38sLBB7cHB", base=0x8c00)
        # save to sd -> bal-set-point
        vars2 = DataSegment(self.charger, "vars2", "BHH12BHBBB", prev_format=vars1)
        # bal-delay, keep-charge-enable -> reg discharge mode
        vars3 = DataSegment(self.charger, "vars3", "BB14H", prev_format=vars2)
        # ni-peak -> cycle-delay
        vars4 = DataSegment(self.charger, "vars4", "16H", prev_format=vars3)
        # cycle-mode -> ni-zn-cell
        vars5 = DataSegment(self.charger, "vars5", "B6HB2HB3HB", prev_format=vars4)

        return Preset(index, vars1, vars2, vars3, vars4, vars5)
