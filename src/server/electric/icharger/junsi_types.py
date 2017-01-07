import struct
import modbus_tk.defines as cst

STATUS_RUN = 0x01
STATUS_ERROR = 0x02
STATUS_CONTROL_STATUS = 0x04
STATUS_RUN_STATUS = 0x08
STATUS_DLG_BOX_STATUS = 0x10
STATUS_CELL_VOLTAGE = 0x20
STATUS_BALANCE = 0x40

Control_RunOperations = (
    (0, "charge"),
    (1, "storage"),
    (2, "discharge"),
    (3, "cycle"),
    (4, "balance only"),
)

Control_OrderOperations = (
    (0, "run"),
    (1, "modify"),
    (2, "write system"),
    (3, "write memory head"),
    (4, "write memory"),
    (5, "trans log on"),
    (6, "trans log off"),
    (7, "msgbox yes"),
    (8, "msgbox no")
)


class DataSegment:
    """
    The iCharger USB HID API cannot read more than 64 bytes at a time, yet some of the data structures are much
    larger than this.  To accommodate multiple reads this class captures all the information about a segment of
    the data-structure, from the base address from which to read, the packed-byte structure (aka C struct) and
    auto calculates the correct offset based off a prior read if required.
    """

    def __init__(self, charger, name, format, base=None, prev_format=None):
        self.func_code = cst.READ_INPUT_REGISTERS

        self.name = name
        self.format = format
        self.size = struct.calcsize("=" + self.format)
        self.addr = base if base is not None else prev_format.addr + prev_format.size / 2

        if self.addr >= 0x8000:
            self.func_code = cst.READ_HOLDING_REGISTERS

        # print("segment:", self.name, " has byte size:", self.size, ", with base addr:", "0x%0.4X" % self.addr)
        self.data = charger.modbus_read_registers(self.addr, format, function_code=self.func_code)


class DeviceInfoStatus:
    def __init__(self, value = 0):
        self.run = 0
        self.err = 0
        self.ctrl_status = 0
        self.run_status = 0
        self.dlg_box_status = 0
        self.cell_volt_status = 0
        self.balance = 0
        self.set_from_modbus_data(value)

    def set_from_modbus_data(self, value):
        self.run = value & STATUS_RUN
        self.err = value & STATUS_ERROR
        self.ctrl_status = value & STATUS_CONTROL_STATUS
        self.run_status = value & STATUS_RUN_STATUS
        self.dlg_box_status = value & STATUS_DLG_BOX_STATUS
        self.cell_volt_status = value & STATUS_CELL_VOLTAGE
        self.balance = value & STATUS_BALANCE


class DeviceInfo:
    def __init__(self, modbus_data = None):
        self.device_id = 0
        self.device_sn = ""
        self.software_ver = 0
        self.hardware_ver = 0
        self.system_len = 0
        self.memory_len = 0
        self.channel_count = 2
        self.ch1_status = DeviceInfoStatus(0)
        self.ch2_status = DeviceInfoStatus(0)

        if modbus_data is not None:
            self.set_from_modbus_data(modbus_data)

    def to_dict(self):
        d = self.__dict__
        d["ch1_status"] = self.ch1_status.__dict__
        d["ch2_status"] = self.ch2_status.__dict__
        return d

    def set_from_modbus_data(self, data):
        self.device_id = data[0]
        self.device_sn = data[1]
        self.software_ver = data[2]
        self.hardware_ver = data[3]
        self.system_len = data[4]
        self.memory_len = data[5]
        self.ch1_status.set_from_modbus_data(data[6])
        self.ch2_status.set_from_modbus_data(data[7])


class CellStatus:
    def __init__(self, c = 0, volt = 0, bal = 0, i = 0):
        self.set_from_modbus_data(c, volt, bal, i)

    def set_from_modbus_data(self, c, volt, bal, i):
        self.cell = c
        self.voltage = volt / 1000.0
        self.balance = bal
        self.ir = i / 10.0

    def to_dict(self):
        return {
            "cell": self.cell,
            "v": self.voltage,
            "balance": self.balance,
            "ir": self.ir
        }


class ChannelStatus:
    def __init__(self, channel = 0, header = None, cell_v = None, cell_b = None, cell_i = None, footer = None):
        self.channel = 0
        self.timestamp = 0
        self.curr_out_power = 0
        self.curr_out_amps = 0
        self.curr_inp_volts = 0
        self.curr_out_volts = 0
        self.curr_out_capacity = 0
        self.curr_int_temp = 0
        self.curr_ext_temp = 0

        self.cells = [ CellStatus(c) for c in range(0, 10) ]

        self.cell_total_ir = 0
        self.cell_total_voltage = 0
        self.cell_count_with_voltage_values = 0
        self.cycle_count = 0
        self.control_status = 0
        self.run_status = 0
        self.run_error = 0
        self.dlg_box_id = 0
        self.line_intern_resistance = 0

        if header is not None and cell_v is not None and cell_b is not None and cell_i is not None and footer is not None:
            self.set_from_modbus_data(channel, header, cell_v, cell_b, cell_i, footer)

    def set_from_modbus_data(self, channel, data, cell_v, cell_b, cell_i, footer):
        self.channel = channel

        self.timestamp = data[0] / 1000.0
        self.curr_out_power = data[1] / 1000.0
        self.curr_out_amps = data[2] / 100.0
        self.curr_inp_volts = data[3] / 1000.0
        self.curr_out_volts = data[4] / 1000.0
        self.curr_out_capacity = data[5] # mAh sent or taken from batt
        self.curr_int_temp = data[6] / 10.0
        self.curr_ext_temp = data[7] / 10.0

        self.cell_count_with_voltage_values = 0
        self.cell_total_voltage = 0
        for x in range(0, 10):
            self.cells[x].set_from_modbus_data(x, cell_v[x], cell_b[x], cell_i[x])
            self.cell_total_voltage += self.cells[x].voltage
            if self.cells[x].voltage > 0:
                self.cell_count_with_voltage_values += 1

        self.cell_total_ir = footer[0] / 10.0
        self.line_intern_resistance = footer[1] / 10.0
        self.cycle_count = footer[2]
        self.control_status = footer[3]
        self.run_status = footer[4]
        self.run_error = footer[5]
        self.dlg_box_id = footer[6]

    def to_dict(self):
        d = self.__dict__
        d["cells"] = [ self.cells[x].to_dict() for x in range(0, 10) ]

        # additional annotations:
        # - no pack plugged in
        # - pack plugged in, no balance leads
        # - pack plugged in, with balance lead
        # - balance lead only
        d["battery_plugged_in"] = (self.curr_out_volts - self.cell_total_voltage) < 1
        d["balance_leads_plugged_in"] = self.cell_total_voltage > 0

        return d


class Control:
    def __init__(self, modbus_data=None):
        self.op = 0
        self.op_description = ""
        self.memory = 0
        self.channel = 0
        self.order_lock = 0
        self.order = 0
        self.order_description = ""
        self.limit_current = 0
        self.limit_volt = 0

        if modbus_data is not None:
            self.set_from_modbus_data(modbus_data)

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

    def set_from_modbus_data(self, data):
        self.op = data[0]
        self.op_description = Control.op_description(self.op)
        self.memory = data[1]
        self.channel = data[2]
        self.order_lock = "0x%0.4X" % data[3]
        self.order = data[4]
        self.order_description = Control.order_description(self.order)
        self.limit_current = data[5] / 1000.0
        self.limit_volt = data[6] / 1000.0

    def to_dict(self):
        return self.__dict__


class PresetIndex:
    MAX_PRESETS = 64

    def __init__(self, count = None, indexes = None):
        self.count = 0
        self.indexes = []
        if count is not None and indexes is not None:
            self.set_from_modbus_data(count, indexes)

    def set_from_modbus_data(self, count, indexes):
        self.count = count
        self.indexes = indexes

    def to_dict(self):
        d = dict()
        d["count"] = self.count
        d["indexes"] = list(self.indexes)
        return d


class SystemStorage:
    def __init__(self, ds1 = None, ds2 = None, ds3 = None):
        self.temp_unit = 0
        self.temp_stop = 0
        self.temp_fans_on = 0
        self.temp_reduce = 0

        self.fans_off_delay = 0
        self.lcd_contrast = 0
        self.light_value = 0

        self.beep_type_key = 0
        self.beep_type_hint = 0
        self.beep_type_alarm = 0
        self.beep_type_done = 0

        self.beep_enabled_key = 0
        self.beep_enabled_hint = 0
        self.beep_enabled_alarm = 0
        self.beep_enabled_done = 0

        self.beep_volume_key = 0
        self.beep_volume_hint = 0
        self.beep_volume_alarm = 0
        self.beep_volume_done = 0

        self.calibration = 0
        self.selected_input_source = 0
        self.selected_input_source_type = "dc"

        self.dc_input_low_voltage = 0
        self.dc_input_over_voltage = 0
        self.dc_input_current_limit = 0

        self.batt_input_low_voltage = 0
        self.batt_input_over_voltage = 0
        self.batt_input_current_limit = 0

        self.regenerative_enable = 0
        self.regenerative_volt_limit = 0
        self.regenerative_current_limit = 0

        # per channel settings
        self.power_priority = 0
        self.power_priority_description = ""

        self.charge_power = [0, 0]
        self.discharge_power = [0, 0]
        self.monitor_log_interval = [0, 0]
        self.monitor_save_to_sd = [0, 0]

        self.servo_type = 0
        self.servo_user_center = 0
        self.server_user_rate = 0
        self.server_user_op_angle = 0

        self.modbus_mode = 0
        self.modbus_serial_addr = 0
        self.modbus_serial_baud_rate = 0
        self.modbus_serial_parity = 0

        if ds1 is not None and ds2 is not None and ds3 is not None:
            self.set_from_modbus_data(ds1, ds2, ds3)

    def set_from_modbus_data(self, ds1, ds2, ds3):
        dummy1 = None
        (self.temp_unit, self.temp_stop, self.temp_fans_on, self.temp_reduce, dummy1, self.fans_off_delay,
         self.lcd_contrast, self.light_value, dummy1,
         self.beep_type_key, self.beep_type_hint, self.beep_type_alarm, self.beep_type_done,
         self.beep_enabled_key, self.beep_enabled_hint, self.beep_enabled_alarm, self.beep_enabled_done,
         self.beep_volume_key, self.beep_volume_hint, self.beep_volume_alarm, self.beep_volume_done) = ds1.data

        (dummy1, self.calibration, dummy1, self.selected_input_source,
         self.dc_input_low_voltage, self.dc_input_over_voltage, self.dc_input_current_limit,
         self.batt_input_low_voltage, self.batt_input_over_voltage, self.batt_input_current_limit,
         self.regenerative_enable, self.regenerative_volt_limit, self.regenerative_current_limit) = ds2.data

        (self.charge_power[0], self.charge_power[1],
         self.discharge_power[0], self.discharge_power[1],
         self.power_priority,
         self.monitor_log_interval[0], self.monitor_log_interval[1],
         self.monitor_save_to_sd[0], self.monitor_save_to_sd[1],
         self.servo_type, self.servo_user_center, self.server_user_rate, self.server_user_op_angle,
         self.modbus_mode, self.modbus_serial_addr, self.modbus_serial_baud_rate,
         self.modbus_serial_parity) = ds3.data

        self.temp_unit = "C" if self.temp_unit == 0 else "F"

        self.temp_stop /= 10.0
        self.temp_fans_on /= 10.0
        self.temp_reduce /= 10.0

        self.selected_input_source_type = "dc" if self.selected_input_source == 0 else "battery"

        if self.power_priority == 0:
            self.power_priority_description = "average"
        if self.power_priority == 1:
            self.power_priority_description = "ch1 priority"
        if self.power_priority == 2:
            self.power_priority_description = "ch2 priority"

    def to_dict(self):
        d = self.__dict__
        return d


class Preset:
    def __init__(self, index, ds1 = None, ds2 = None, ds3 = None, ds4 = None, ds5 = None):
        self.index = index

        self.use_flag = 0  # 0xffff=empty, 0x55aa=used, 0x0000=fixed
        self.name = ""
        self.capacity = 0
        self.auto_save = False
        self.li_balance_end_mode = 0
        self.op_enable_mask = 0xff

        self.channel_mode = 0
        self.save_to_sd = False
        self.log_interval = 0  # 0.1s
        self.run_counter = 0

        self.type = 0
        self.li_cell = 0
        self.ni_cell = 0
        self.pb_cell = 0

        self.li_mode_c = 0
        self.li_mode_d = 0
        self.ni_mode_c = 0
        self.ni_mode_d = 0
        self.pb_mode_c = 0
        self.pb_mode_d = 0

        self.bal_speed = 0  # 0=slow, 1=normal, 2=fast
        self.bal_start_mode = 0
        self.bal_start_voltage = 0
        self.bal_diff = 0
        self.bal_over_point = 0
        self.bal_set_point = 0
        self.bal_delay = 0

        self.keep_charge_enable = 0

        self.lipo_charge_cell_voltage = 0
        self.lilo_charge_cell_voltage = 0
        self.life_charge_cell_voltage = 0

        self.lipo_storage_cell_voltage = 0
        self.lilo_storage_cell_voltage = 0
        self.life_storage_cell_voltage = 0

        self.lipo_discharge_cell_voltage = 0
        self.lilo_discharge_cell_voltage = 0
        self.life_discharge_cell_voltage = 0

        self.charge_current = 0
        self.discharge_current = 0
        self.end_charge = 0
        self.end_discharge = 0
        self.regen_discharge_mode = 0

        self.ni_peak = 0
        self.ni_peak_delay = 0
        self.ni_trickle_enable = 0
        self.ni_trickle_current = 0
        self.ni_trickle_time = 0

        self.ni_zero_enable = 0

        self.ni_discharge_voltage = 0
        self.pb_charge_voltage = 0
        self.pb_discharge_voltage = 0
        self.pb_cell_float_enable = 0
        self.pb_cell_float_voltage = 0

        self.restore_voltage = 0
        self.restore_time = 0
        self.restore_current = 0

        self.cycle_count = 0
        self.cycle_delay = 0
        self.cycle_mode = 0

        self.safety_time_c = 0
        self.safety_cap_c = 0
        self.safety_temp_c = 0

        self.safety_time_d = 0
        self.safety_cap_d = 0
        self.safety_temp_d = 0

        self.reg_ch_mode = 0
        self.reg_ch_volt = 0
        self.reg_ch_current = 0

        self.fast_store = 0
        self.store_compensation = 0

        self.ni_zn_charge_cell_volt = 0
        self.ni_zn_discharge_cell_volt = 0
        self.ni_zn_cell = 0

        if ds1 is not None and ds2 is not None and ds3 is not None and ds4 is not None and ds5 is not None:
            self.set_from_modbus_data(ds1, ds2, ds3, ds4, ds5)

    def set_from_modbus_data(self, ds1, ds2, ds3, ds4, ds5):
        (self.use_flag, self.name, self.capacity, self.auto_save, self.li_balance_end_mode,
         a, b, c, d, e, f, g,  # 7 reserved bytes
         self.op_enable_mask, self.channel_mode) = ds1.data

        (self.save_to_sd, self.log_interval,
         self.run_counter,
         self.type,
         self.li_cell, self.ni_cell, self.pb_cell,
         self.li_mode_c, self.li_mode_d,
         self.ni_mode_c, self.ni_mode_d,
         self.pb_mode_c, self.pb_mode_d,
         self.bal_speed, self.bal_start_mode, self.bal_start_voltage, self.bal_diff,
         self.bal_over_point, self.bal_set_point) = ds2.data

        (self.bal_delay, self.keep_charge_enable,
         self.lipo_charge_cell_voltage, self.lilo_charge_cell_voltage, self.life_charge_cell_voltage,
         self.lipo_storage_cell_voltage, self.lilo_storage_cell_voltage, self.life_storage_cell_voltage,
         self.lipo_discharge_cell_voltage, self.lilo_discharge_cell_voltage, self.life_discharge_cell_voltage,
         self.charge_current, self.discharge_current, self.end_charge, self.end_discharge,
         self.regen_discharge_mode) = ds3.data

        (self.ni_peak, self.ni_peak_delay,
         self.ni_trickle_enable, self.ni_trickle_current, self.ni_trickle_time,
         self.ni_zero_enable,
         self.ni_discharge_voltage, self.pb_charge_voltage, self.pb_discharge_voltage, self.pb_cell_float_enable,
         self.pb_cell_float_voltage, self.restore_voltage, self.restore_time, self.restore_current,
         self.cycle_count, self.cycle_delay) = ds4.data

        (self.cycle_mode,
         self.safety_time_c, self.safety_cap_c, self.safety_temp_c, self.safety_time_d, self.safety_cap_d,
         self.safety_temp_d, self.reg_ch_mode, self.reg_ch_volt, self.reg_ch_current, self.fast_store,
         self.store_compensation, self.ni_zn_charge_cell_volt, self.ni_zn_discharge_cell_volt,
         self.ni_zn_cell) = ds5.data

        self.life_charge_cell_voltage /= 1000.0
        self.life_discharge_cell_voltage /= 1000.0
        self.life_storage_cell_voltage /= 1000.0

        self.lilo_charge_cell_voltage /= 1000.0
        self.lilo_discharge_cell_voltage /= 1000.0
        self.lilo_storage_cell_voltage /= 1000.0

        self.lipo_charge_cell_voltage /= 1000.0
        self.lipo_discharge_cell_voltage /= 1000.0
        self.lipo_storage_cell_voltage /= 1000.0

        if self.type == 0:
            self.type = "LiPo"
        elif self.type == 1:
            self.type = "LiLo"
        elif self.type == 2:
            self.type = "LiFe"
        elif self.type == 3:
            self.type = "NiMH"
        elif self.type == 4:
            self.type = "Nicd"
        elif self.type == 5:
            self.type = "Pb"

    def to_dict(self):
        return self.__dict__