import struct
import modbus_tk.defines as cst
from schematics.models import  Model
from schematics.transforms import blacklist
from schematics.types import StringType, IntType, LongType, FloatType, BooleanType
from schematics.types.serializable import serializable
from schematics.types.compound import ModelType, ListType

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


class DeviceInfoStatus(Model):
    value = IntType(required=True, min_value=0, max_value=0x7f)

    class Options:
        # this means that value won't appear in the JSON output by default
        roles = {'default': blacklist('value')}

    def __init__(self, value = 0):
        super(DeviceInfoStatus, self).__init__()
        self.value = value

    @serializable
    def run(self):
        return self.value & STATUS_RUN

    @serializable
    def err(self):
        return self.value & STATUS_ERROR

    @serializable
    def ctrl_status(self):
        return self.value & STATUS_CONTROL_STATUS

    @serializable
    def run_status(self):
        return self.value & STATUS_RUN_STATUS

    @serializable
    def dlg_box_status(self):
        return self.value & STATUS_DLG_BOX_STATUS

    @serializable
    def cell_volt_status(self):
        return self.value & STATUS_CELL_VOLTAGE

    @serializable
    def balance(self):
        return self.value & STATUS_BALANCE


class DeviceInfo(Model):
    device_id = IntType(required=True)
    device_sn = StringType(required=True)
    software_ver = LongType(required=True)
    hardware_ver = LongType(required=True)
    system_len = IntType(required=True)
    memory_len = IntType(required=True)
    channel_count = IntType(required=True, default=2)
    ch1_status = ModelType(DeviceInfoStatus, default=DeviceInfoStatus())
    ch2_status = ModelType(DeviceInfoStatus, default=DeviceInfoStatus())

    def __init__(self, modbus_data = None):
        super(DeviceInfo, self).__init__()
        if modbus_data is not None:
            self.set_from_modbus_data(modbus_data)

    def set_from_modbus_data(self, data):
        self.device_id = data[0]
        self.device_sn = data[1].split('\0')[0]
        self.software_ver = data[2]
        self.hardware_ver = data[3]
        self.system_len = data[4]
        self.memory_len = data[5]
        self.ch1_status = DeviceInfoStatus(data[6])
        self.ch2_status = DeviceInfoStatus(data[7])


class CellStatus(Model):
    cell = IntType(required=True, min_value=0, max_value=9)
    voltage = FloatType(required=True, serialized_name="v")
    balance = IntType(required=True)
    ir = FloatType(required=True)

    def __init__(self, c = 0, volt = 0, bal = 0, i = 0):
        super(CellStatus, self).__init__()
        self.set_from_modbus_data(c, volt, bal, i)

    def set_from_modbus_data(self, c, volt, bal, i):
        self.cell = c
        self.voltage = volt / 1000.0
        self.balance = bal
        self.ir = i / 10.0


class ChannelStatus(Model):
    channel = IntType(required=True, min_value=0, max_value=1)
    timestamp = LongType(required=True, default=0)
    curr_out_power = FloatType(required=True)
    curr_out_amps = FloatType(required=True)
    curr_inp_volts = FloatType(required=True)
    curr_out_volts = FloatType(required=True)
    curr_out_capacity = FloatType(required=True)
    curr_int_temp = FloatType(required=True)
    curr_ext_temp = FloatType(required=True)

    cells = ListType(ModelType(CellStatus))

    cell_total_ir = FloatType(required=True)
    cell_total_voltage = FloatType(required=True)
    cell_count_with_voltage_values = FloatType(required=True)
    cycle_count = IntType(required=True)
    control_status = IntType(required=True)
    run_status = IntType(required=True)
    run_error = IntType(required=True)
    dlg_box_id = IntType(required=True)
    line_intern_resistance = FloatType(required=True)

    def __init__(self, channel = 0, header = None, cell_v = None, cell_b = None, cell_i = None, footer = None):
        super(ChannelStatus, self).__init__()
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

        cells = []
        for x in range(0, 10):
            c = CellStatus(x, cell_v[x], cell_b[x], cell_i[x])
            cells.append(c)
            self.cell_total_voltage += c.voltage
            if c.voltage > 0:
                self.cell_count_with_voltage_values += 1

        self.cells = cells

        self.cell_total_ir = footer[0] / 10.0
        self.line_intern_resistance = footer[1] / 10.0
        self.cycle_count = footer[2]
        self.control_status = footer[3]
        self.run_status = footer[4]
        self.run_error = footer[5]
        self.dlg_box_id = footer[6]

    @serializable
    def battery_plugged_in(self):
        return (self.curr_out_volts - self.cell_total_voltage) < 1

    @serializable
    def balance_leads_plugged_in(self):
        return self.cell_total_voltage > 0


class Control(Model):
    op = IntType(required=True)
    memory = IntType(required=True)
    channel = IntType(required=True, min_value=0, max_value=1)
    order_lock = StringType(required=True)
    order = IntType(default=0)
    limit_current = FloatType(required=True)
    limit_volt = FloatType(required=True)

    def __init__(self, modbus_data=None):
        super(Control, self).__init__()
        if modbus_data is not None:
            self.set_from_modbus_data(modbus_data)

    @serializable
    def op_description(self):
        for (num, name) in Control_RunOperations:
            if self.op == num:
                return name
        return None

    @serializable
    def order_description(self):
        for (num, name) in Control_OrderOperations:
            if self.order == num:
                return name
        return None

    def set_from_modbus_data(self, data):
        self.op = data[0]
        self.memory = data[1]
        self.channel = data[2]
        self.order_lock = "0x%0.4X" % data[3]
        self.order = data[4]
        self.limit_current = data[5] / 1000.0
        self.limit_volt = data[6] / 1000.0


class SystemStorage(Model):
    temp_unit = StringType(required=True, min_length=1, max_length=1)
    temp_stop = FloatType(required=True)
    temp_fans_on = FloatType(required=True)
    temp_reduce = FloatType(required=True)

    fans_off_delay = IntType(required=True)
    lcd_contrast = IntType(required=True)
    light_value = IntType(required=True)

    beep_type_key = IntType(required=True)
    beep_type_hint = IntType(required=True)
    beep_type_alarm = IntType(required=True)
    beep_type_done = IntType(required=True)

    beep_enabled_key = BooleanType(required=True)
    beep_enabled_hint = BooleanType(required=True)
    beep_enabled_alarm = BooleanType(required=True)
    beep_enabled_done = BooleanType(required=True)

    beep_volume_key = IntType(required=True, min_value=0, max_value=10)
    beep_volume_hint = IntType(required=True, min_value=0, max_value=10)
    beep_volume_alarm = IntType(required=True, min_value=0, max_value=10)
    beep_volume_done = IntType(required=True, min_value=0, max_value=10)

    calibration = IntType(required=True)
    selected_input_source = IntType(required=True)

    dc_input_low_voltage = FloatType(required=True)
    dc_input_over_voltage = FloatType(required=True)
    dc_input_current_limit = FloatType(required=True)

    batt_input_low_voltage = FloatType(required=True)
    batt_input_over_voltage = FloatType(required=True)
    batt_input_current_limit = FloatType(required=True)

    regenerative_enable = IntType(required=True)
    regenerative_volt_limit = FloatType(required=True)
    regenerative_current_limit = FloatType(required=True)

    power_priority = IntType(required=True)

    charge_power = ListType(IntType)
    discharge_power = ListType(IntType)
    monitor_log_interval = ListType(IntType)
    monitor_save_to_sd = ListType(BooleanType)

    servo_type = LongType(required=True)
    servo_user_center = LongType(required=True)
    server_user_rate = LongType(required=True)
    server_user_op_angle = LongType(required=True)

    modbus_mode = LongType(required=True)
    modbus_serial_addr = LongType(required=True)
    modbus_serial_baud_rate = LongType(required=True)
    modbus_serial_parity = LongType(required=True)

    def __init__(self, ds1 = None, ds2 = None, ds3 = None):
        super(SystemStorage, self).__init__()
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

        self.charge_power = [0, 0]
        self.discharge_power = [0, 0]
        self.monitor_log_interval = [0, 0]
        self.monitor_save_to_sd = [False, False]

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

    @serializable
    def selected_input_source_type(self):
        return "dc" if self.selected_input_source == 0 else "battery"

    @serializable
    def power_priority_description(self):
        if self.power_priority == 0:
            return "average"
        if self.power_priority == 1:
            return "ch1 priority"
        if self.power_priority == 2:
            return "ch2 priority"


class PresetIndex(Model):
    count = IntType(required=True, min_value=0, max_value=63, default=0)
    indexes = ListType(IntType, required=True, min_size=0, max_size=63, default=[])

    def __init__(self, count = None, indexes = None):
        super(PresetIndex, self).__init__()
        if count is not None and indexes is not None:
            self.set_from_modbus_data(count, indexes)

    def set_from_modbus_data(self, count, indexes):
        self.count = count
        self.indexes = indexes


class Preset(Model):
    index = IntType(required=True, min_value=0, max_value=63)

    use_flag = IntType(required=True, choices=[0xffff, 0x55aa, 0x0000])
    name = StringType(required=True, max_length=37)
    capacity = LongType(required=True)
    auto_save = BooleanType(required=True, default=False)
    li_balance_end_mode = IntType(required=True, default=0)
    op_enable_mask = IntType(required=True, default=0xff)

    channel_mode = IntType(required=True, choices=[0, 1])
    save_to_sd = BooleanType(required=True, default=True)
    log_interval = IntType(required=True)
    run_counter = IntType(required=True)

    type = IntType(required=True, choices=[0, 1, 2, 3, 4, 5])
    li_cell = IntType(required=True)
    ni_cell = IntType(required=True)
    pb_cell = IntType(required=True)

    li_mode_c = IntType(required=True, choices=[0, 1])
    li_mode_d = IntType(required=True, choices=[0, 1])
    ni_mode_c = IntType(required=True, choices=[0, 1])
    ni_mode_d = IntType(required=True, choices=[0, 1])
    pb_mode_c = IntType(required=True, choices=[0, 1])
    pb_mode_d = IntType(required=True, choices=[0, 1])

    bal_speed = IntType(required=True, choices=[0, 1, 2, 3])  # 0=slow, 1=normal, 2=fast, 3=user
    bal_start_mode = IntType(required=True)
    bal_start_voltage = IntType(required=True)
    bal_diff = IntType(required=True)
    bal_over_point = IntType(required=True)
    bal_set_point = IntType(required=True)
    bal_delay = IntType(required=True)

    keep_charge_enable = BooleanType(required=True)

    lipo_charge_cell_voltage = FloatType(required=True)
    lilo_charge_cell_voltage = FloatType(required=True)
    lifcharge_cell_voltage = FloatType(required=True)

    lipo_storage_cell_voltage = FloatType(required=True)
    lilo_storage_cell_voltage = FloatType(required=True)
    life_storage_cell_voltage = FloatType(required=True)

    lipo_discharge_cell_voltage = FloatType(required=True)
    lilo_discharge_cell_voltage = FloatType(required=True)
    life_discharge_cell_voltage = FloatType(required=True)

    charge_current = FloatType(required=True)
    discharge_current = FloatType(required=True)
    end_charge = FloatType(required=True)
    end_discharge = FloatType(required=True)
    regen_discharge_mode = IntType(required=True, choices=[0, 1, 2, 3])

    ni_peak = FloatType(required=True)
    ni_peak_delay = IntType(required=True)
    ni_trickle_enable = BooleanType(required=True)
    ni_trickle_current = FloatType(required=True)
    ni_trickle_time = IntType(required=True)

    ni_zero_enable = BooleanType(required=True)

    ni_discharge_voltage = FloatType(required=True)
    pb_charge_voltage = FloatType(required=True)
    pb_discharge_voltage = FloatType(required=True)
    pb_cell_float_enable = BooleanType(required=True)
    pb_cell_float_voltage = FloatType(required=True)

    restore_voltage = FloatType(required=True)
    restore_time = IntType(required=True)
    restore_current = FloatType(required=True)

    cycle_count = IntType(required=True)
    cycle_delay = IntType(required=True)
    cycle_mode = IntType(required=True)

    safety_time_c = IntType(required=True)
    safety_cap_c = IntType(required=True)
    safety_temp_c = FloatType(required=True)

    safety_time_d = IntType(required=True)
    safety_cap_d = IntType(required=True)
    safety_temp_d = FloatType(required=True)

    reg_ch_mode = IntType(required=True)
    reg_ch_volt = FloatType(required=True)
    reg_ch_current = FloatType(required=True)

    fast_store = BooleanType(required=True, default=True)
    store_compensation = IntType(required=True)

    ni_zn_charge_cell_volt = FloatType(required=True)
    ni_zn_discharge_cell_volt = FloatType(required=True)
    ni_zn_cell = IntType(required=True, default=0)

    def __init__(self, index, ds1 = None, ds2 = None, ds3 = None, ds4 = None, ds5 = None):
        super(Preset, self).__init__()
        self.index = index
        if ds1 is not None and ds2 is not None and ds3 is not None and ds4 is not None and ds5 is not None:
            self.set_from_modbus_data(ds1, ds2, ds3, ds4, ds5)

    @serializable
    def type_str(self):
        if self.type == 0:
            return "LiPo"
        elif self.type == 1:
            return "LiLo"
        elif self.type == 2:
            return "LiFe"
        elif self.type == 3:
            return "NiMH"
        elif self.type == 4:
            return "Nicd"
        elif self.type == 5:
            return "Pb"

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

        self.name = self.name.split('\0')[0]

