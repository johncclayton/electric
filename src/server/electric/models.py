import copy
import logging
import struct

from schematics.models import Model
from schematics.transforms import blacklist
from schematics.types import StringType, IntType, LongType, FloatType, BooleanType
from schematics.types.compound import ModelType, ListType
from schematics.types.serializable import serializable

logger = logging.getLogger('electric.app.{0}'.format(__name__))

# copied from modbus protocol spec
READ_HOLDING_REGISTERS = 3
READ_INPUT_REGISTERS = 4
WRITE_MULTIPLE_REGISTERS = 16


class Operation:
    Charge = 0
    Storage = 1
    Discharge = 2
    Cycle = 3
    Balance = 4
    MeasureIR = 5


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


class ChemistryType:
    LiPo = 0
    LiLo = 1
    LiFe = 2
    NiMH = 3
    NiCd = 4
    Pb = 5
    NiZn = 6


'''

DeviceInfo:
- General Status Word:

Channel:
- control_status
- run_status

'''

# "general status word"
# fully stopped / idle: cell volt (no run or control flags. run_status=0 and control_status=0)
# charging: cell volt, control, run
# stopped (after some operation): cell volt, run
# storage (charging): cell volt, control, run
# discharging: ctrl_status, run, run_status

STATUS_RUN = 0x01
STATUS_ERROR = 0x02
STATUS_CONTROL_STATUS = 0x04
STATUS_RUN_STATUS = 0x08
STATUS_DLG_BOX_STATUS = 0x10
STATUS_CELL_VOLTAGE = 0x20
STATUS_BALANCE = 0x40

DEVICEID_4010_DUO = 64
DEVICEID_406_DUO = 67  # TODO: Update to the real device number
DEVICEID_308_DUO = 66


class ObjectNotFoundException(Exception):
    status_code = 404


class BadRequestException(Exception):
    status_code = 404


DeviceIdCellCount = (
    (DEVICEID_308_DUO, 8),
    (DEVICEID_406_DUO, 6),
    (DEVICEID_4010_DUO, 10)
)

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

class ReadDataSegment:
    """
    The iCharger USB HID API cannot read more than 64 bytes at a time, yet some of the data structures are much
    larger than this.  To accommodate multiple reads this class captures all the information about a segment of
    the data-structure, from the base address from which to read, the packed-byte structure (aka C struct) and
    auto calculates the correct offset based off a prior read if required.
    """

    def __init__(self, charger, name, fmt, base=None, prev_format=None):
        self.func_code = READ_INPUT_REGISTERS

        self.name = name
        self.format = fmt
        self.size = struct.calcsize("=" + self.format)
        self.addr = base if base is not None else prev_format.addr + prev_format.size / 2

        if self.addr >= 0x8000:
            self.func_code = READ_HOLDING_REGISTERS

        self.data = charger.modbus_read_registers(self.addr, self.format, function_code=self.func_code)


class WriteDataSegment(object):
    def __init__(self, charger, name, data_tuples, data_format, base=None, prev_format=None):
        self.func_code = WRITE_MULTIPLE_REGISTERS
        self.name = name

        self.data = self.convert_tuples_to_u16s(data_tuples, data_format)

        # / 2 because offsets are expressed in words
        self.addr = base if base is not None else prev_format.addr + (prev_format.size_in_bytes / 2)
        (number_of_words_returned,) = charger.modbus_write_registers(self.addr, self.data)

        # Actually, we know that the data being written is all "H" or "h" (2 bytes)
        # So bytes is simply: len(self.data) * 2
        self.size_in_bytes = len(self.data) * 2

    @staticmethod
    def convert_tuples_to_u16s(data_tuples, data_format):
        # modbus_write_registers expects a bunch of U16s
        # Thus we expect the data_tuples to have a format supplied.
        # We convert this to a set of U16s. As such, each format MUST be of length divisible by 2.
        native_format = "=" + data_format
        format_length = struct.calcsize(native_format)
        if format_length % 2 == 1:
            msg = "Data format {1} has size {0}. Must be divisible by 2 for U16s conversion to succeed".format(format_length, data_format)
            raise Exception(msg)

        packed_data_as_bytes = struct.pack(native_format, *data_tuples)

        # Some paranoia
        size_of_packed_data = len(packed_data_as_bytes)
        if size_of_packed_data % 2 == 1:
            raise Exception(
                "Packed data has size {0} (which is unexpected, since the previous packing size test passed). Must be divisible by 2 for U16s conversion to succeed".format(
                    size_of_packed_data))

        u16s_repeat = size_of_packed_data / 2
        u16s_format = "{0}H".format(u16s_repeat)
        return struct.unpack(u16s_format, packed_data_as_bytes)


class RFIDTag(Model):
    # Battery ID
    battery_id = IntType(required=True, min_value=0)
    
    # Tag UID
    tag_uid = ListType(IntType, required=False, min_size=4, max_size=4)

    # Chemistry (e.g. LiPo, LiFe, NiMH)
    chemistry = IntType(required=True, min_value=ChemistryType.LiPo, max_value=ChemistryType.NiZn, default=ChemistryType.LiPo)                                                                    

    # Capacity in mAh
    capacity = IntType(required=False, min_value=1, default=100)
    
    # Number of cells
    cells = IntType(required=False, min_value=1, max_value=20, default=3)    
    
    # C rating of the pack
    c_rating = FloatType(required=True, min_value=0.1, max_value=5, default=1)    
    
    # Charge cycles
    cycles = IntType(required=False, min_value=0, default=0)

    # Charge rate limit in C
    c_charge_limit = IntType(required=False, default=1)
    
    # Desired charge rate in mA (validated against c_charge_limit)
    charge_mA = IntType(required=True, min_value=1, default=1000)
    
    # Discharge rate in mA
    discharge_mA = IntType(required=True, min_value=1, default=1000)


class CaseFan(Model):
    # Whether or not we should be trying to control the fan at all
    control = BooleanType(required=False, default=False)

    # True if the fan is currently running (GPIO pin is high)
    running = BooleanType(default=False, required=False)

    # Temp you want fan to kick in at
    threshold = IntType(required=False, min_value=-30, max_value=80, default=37)

    # How much lag do you want, in deg C?
    hysteresis = IntType(required=False, min_value=0, max_value=20, default=3)

    # Which pin on the board will control the fan circuit?
    gpio = IntType(required=False, min_value=1, max_value=40, default=16)


class DeviceInfoStatus(Model):
    value = IntType(required=True, min_value=0, max_value=0x7f)

    class Options:
        # this means that value won't appear in the JSON output by default
        roles = {'default': blacklist('value')}

    def __init__(self, value=0):
        super(DeviceInfoStatus, self).__init__()
        self.value = value

    @serializable
    def run(self):
        return (self.value & STATUS_RUN) == STATUS_RUN

    @serializable
    def err(self):
        return (self.value & STATUS_ERROR) == STATUS_ERROR

    @serializable
    def ctrl_status(self):
        return (self.value & STATUS_CONTROL_STATUS) == STATUS_CONTROL_STATUS

    @serializable
    def run_status(self):
        return (self.value & STATUS_RUN_STATUS) == STATUS_RUN_STATUS

    @serializable
    def dlg_box_status(self):
        return (self.value & STATUS_DLG_BOX_STATUS) == STATUS_DLG_BOX_STATUS

    @serializable
    def cell_volt_status(self):
        return (self.value & STATUS_CELL_VOLTAGE) == STATUS_CELL_VOLTAGE

    @serializable
    def balance(self):
        return (self.value & STATUS_BALANCE) == STATUS_BALANCE


class DeviceInfo(Model):
    device_id = IntType(required=True)
    device_sn = StringType(required=True)
    software_ver = LongType(required=True)
    hardware_ver = LongType(required=True)
    system_len = IntType(required=True)
    memory_len = IntType(required=True)
    channel_count = IntType(required=True, default=2)
    cell_count = IntType(required=True, default=0)

    ch1_status = ModelType(DeviceInfoStatus, default=DeviceInfoStatus())
    ch2_status = ModelType(DeviceInfoStatus, default=DeviceInfoStatus())

    def __init__(self, modbus_data=None):
        super(DeviceInfo, self).__init__()
        if modbus_data is not None:
            self.set_from_modbus_data(modbus_data)

    def get_status(self, channel):
        return self.ch1_status if channel == 0 else self.ch2_status

    def set_from_modbus_data(self, data):
        self.device_id = data[0]
        self.device_sn = data[1].split('\0')[0]
        self.software_ver = data[2]
        self.hardware_ver = data[3]
        self.system_len = data[4]
        self.memory_len = data[5]
        self.ch1_status = DeviceInfoStatus(data[6])
        self.ch2_status = DeviceInfoStatus(data[7])

        for (device_id, cell_count) in DeviceIdCellCount:
            if device_id == self.device_id:
                self.cell_count = cell_count


class OperationResponse(Model):
    first_number = IntType(required=True)
    second_number = IntType(required=False)

    def __init__(self, modbus_data=None):
        super(OperationResponse, self).__init__()
        if modbus_data is not None:
            self.set_from_modbus_data(modbus_data)

    # Beats me
    @serializable()
    def success(self):
        return self.first_number == 128

    @serializable()
    def error(self):
        return not self.success

    def set_from_modbus_data(self, data):
        self.first_number = data[0]
        if len(data) > 1:
            self.second_number = data[1]


class CellStatus(Model):
    cell = IntType(required=True, min_value=0, max_value=9)
    voltage = FloatType(required=True, serialized_name="v")
    balance = IntType(required=True)
    ir = FloatType(required=True)

    def __init__(self, c=0, volt=0, bal=0, i=0):
        super(CellStatus, self).__init__()
        self.set_from_modbus_data(c, volt, bal, i)

    def set_from_modbus_data(self, c, volt, bal, i):
        self.cell = c
        self.voltage = volt / 1000.0
        self.balance = bal
        self.ir = i / 10.0


class ChannelStatus(Model):
    channel = IntType(required=True, min_value=0, max_value=1, default=0)
    timestamp = LongType(required=True, default=0)
    curr_out_power = FloatType(required=True, default=0)
    curr_out_amps = FloatType(required=True, default=0)
    curr_inp_volts = FloatType(required=True, default=0)
    curr_out_volts = FloatType(required=True, default=0)
    curr_out_capacity = FloatType(required=True, default=0)
    curr_int_temp = FloatType(required=True, default=0)
    curr_ext_temp = FloatType(required=True, default=0)

    cells = ListType(ModelType(CellStatus), default=[])

    cell_total_ir = FloatType(required=True, default=0)
    cell_total_voltage = FloatType(required=True, default=0)
    cell_count_with_voltage_values = FloatType(required=True, default=0)
    cycle_count = IntType(required=True, default=0)
    control_status = IntType(required=True, default=0)
    run_status = IntType(required=True, default=0)
    run_error = IntType(required=True, default=0)
    dlg_box_id = IntType(required=True, default=0)
    line_intern_resistance = FloatType(required=True, default=0)

    # Optionally added to the response, when a channel status is requested
    status = ModelType(DeviceInfoStatus)

    def __init__(self):
        super(ChannelStatus, self).__init__()
        self.device_id = None

    @staticmethod
    def modbus(device_id=None, channel=0, header=None, cell_v=None, cell_b=None, cell_i=None, footer=None):
        status = ChannelStatus()
        if header is not None and cell_v is not None and cell_b is not None and cell_i is not None and footer is not None:
            status.set_from_modbus_data(device_id, channel, header, cell_v, cell_b, cell_i, footer)
        return status

    def set_from_modbus_data(self, device_id, channel, data, cell_v, cell_b, cell_i, footer):
        self.device_id = device_id

        self.channel = channel

        self.timestamp = data[0] / 1000.0
        self.curr_out_power = data[1] / 1000.0
        self.curr_out_amps = data[2] / 100.0
        self.curr_inp_volts = data[3] / 1000.0
        self.curr_out_volts = data[4] / 1000.0
        self.curr_out_capacity = data[5]  # mAh sent or taken from batt
        self.curr_int_temp = data[6] / 10.0
        self.curr_ext_temp = data[7] / 10.0

        self.cell_count_with_voltage_values = 0
        self.cell_total_voltage = 0

        cells = []
        for x in range(0, 10):
            if cell_v[x] == 1024:
                continue
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

        # print "channel: {0}, len cels: {3}, cell_total_volt: {1}, curr_out_volt is: {2}".format(channel,
        #                                                                                         self.cell_total_voltage,
        #                                                                                         self.curr_out_volts,
        #                                                                                         self.cell_count_with_voltage_values)

        # If the charger isn't doing anything, make sure timestamp shows 00:00
        if self.run_status == 0:
            self.timestamp = 0

    def max_charger_input_voltage(self):
        return 0

    @serializable
    def battery_plugged_in(self):
        plugged_in = False

        if self.device_id:
            max_voltage = 0

            # With this, we can work out if the main battery lead is plugged in
            if self.device_id is DEVICEID_406_DUO:
                max_voltage = 22  # because 3.75 * n gives the max voltage?
            elif self.device_id is DEVICEID_308_DUO:
                max_voltage = 30
            elif self.device_id is DEVICEID_4010_DUO:
                max_voltage = 38

            # if there are no balance leads plugged in, zero out the curr_out_volts
            if self.cell_count_with_voltage_values == 0:
                if self.curr_out_volts > max_voltage:
                    plugged_in = False
                else:
                    plugged_in = True

        pcnt_diff = 0
        if self.cell_count_with_voltage_values > 0:
            pcnt_diff = abs(100.0 - ((self.curr_out_volts / self.cell_total_voltage) * 100.0))
            # if the difference is too great - then we think that curr_out_volts is total lies
            if pcnt_diff < 3.0:
                plugged_in = True

        # if self.channel == 0:
        #     logger.info("channel: {0}, plugged_in: {1}, cells: {2}, pcnt_diff: {3}, curr_out_volts: {4}, cell_total_voltage: {5}".format(
        #         self.channel,
        #         plugged_in,
        #         self.cell_count_with_voltage_values,
        #         pcnt_diff,
        #         self.curr_out_volts,
        #         self.cell_total_voltage))

        return plugged_in

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
    lcd_brightness = IntType(required=True)

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

    dc_input_low_voltage = FloatType(required=True, min_value=9, max_value=48)
    dc_input_over_voltage = FloatType(required=True)
    dc_input_current_limit = FloatType(required=True, min_value=1, max_value=65)

    batt_input_low_voltage = FloatType(required=True, min_value=9, max_value=48)
    batt_input_over_voltage = FloatType(required=True)
    batt_input_current_limit = FloatType(required=True, min_value=1, max_value=65)

    regenerative_enable = IntType(required=True)
    regenerative_volt_limit = FloatType(required=True, min_value=9, max_value=48)
    regenerative_current_limit = FloatType(required=True, min_value=1, max_value=65)

    power_priority = IntType(required=True)

    charge_power = ListType(IntType(min_value=5, max_value=800))
    discharge_power = ListType(IntType(min_value=5, max_value=80))
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

    @staticmethod
    def modbus(ds1=None, ds2=None, ds3=None):
        if ds1 is not None and ds2 is not None and ds3 is not None:
            storage = SystemStorage()
            storage.set_from_modbus_data(ds1, ds2, ds3)
            return storage
        return None

    def set_from_modbus_data(self, ds1, ds2, ds3):
        dummy1 = None
        (self.temp_unit, self.temp_stop, self.temp_fans_on, self.temp_reduce, dummy1, self.fans_off_delay,
         self.lcd_contrast, self.lcd_brightness, dummy1,
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

        self.temp_unit = "C" if self.temp_unit is 0 else "F"

        self.temp_stop /= 10.0
        self.temp_fans_on /= 10.0

        self.dc_input_low_voltage /= 10.0
        self.dc_input_current_limit /= 10.0
        self.dc_input_over_voltage /= 10.0

        self.batt_input_low_voltage /= 10.0
        self.batt_input_over_voltage /= 10.0
        self.batt_input_current_limit /= 10.0

        self.regenerative_volt_limit /= 10.0
        self.regenerative_current_limit /= 10.0

    def to_modbus_data(self):
        s1 = (0 if self.temp_unit == "C" else 1, self.temp_stop * 10, self.temp_fans_on * 10, self.temp_reduce,)

        # Note, the trailing 0 is required, else the lcd_brightness isn't set correctly.
        s2 = (self.fans_off_delay, self.lcd_contrast, self.lcd_brightness, 0,)
        s3 = (self.beep_type_key, self.beep_type_hint, self.beep_type_alarm, self.beep_type_done,
              self.beep_enabled_key, self.beep_enabled_hint, self.beep_enabled_alarm, self.beep_enabled_done,
              self.beep_volume_key, self.beep_volume_hint, self.beep_volume_alarm, self.beep_volume_done,)
        s4 = (self.calibration,)

        # Note, the trailing 0 is required, else the regenerative_current_limit isn't set correctly.
        s5 = (self.selected_input_source,
              self.dc_input_low_voltage * 10, self.dc_input_over_voltage * 10, self.dc_input_current_limit * 10,
              self.batt_input_low_voltage * 10, self.batt_input_over_voltage * 10, self.batt_input_current_limit * 10,
              self.regenerative_enable, self.regenerative_volt_limit * 10, self.regenerative_current_limit * 10, 0,)

        # Note, the trailing 0 is required, else the modbus_serial_parity isn't set correctly.
        s6 = (self.charge_power[0], self.charge_power[1],
              self.discharge_power[0], self.discharge_power[1],
              self.power_priority,
              self.monitor_log_interval[0], self.monitor_log_interval[1],
              self.monitor_save_to_sd[0], self.monitor_save_to_sd[1],
              self.servo_type, self.servo_user_center, self.server_user_rate, self.server_user_op_angle,
              self.modbus_mode, self.modbus_serial_addr, self.modbus_serial_baud_rate,
              self.modbus_serial_parity, 0)
        return s1, s2, s3, s4, s5, s6

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
    indexes = ListType(IntType(min_value=0, max_value=255), required=True, min_size=0, max_size=63, default=[])

    @staticmethod
    def modbus(count=None, indexes=None):
        if count is not None and indexes is not None:
            pi = PresetIndex()
            pi.set_from_modbus_data(count, indexes)
            return pi
        return None

    def preset_exists_at_index(self, index):
        return self.indexes[index] != 255

    def index_of_preset_with_memory_slot_number(self, memory_slot_number):
        for index in self.range_of_presets():
            if self.indexes[index] == memory_slot_number:
                return index
        return None

    @property
    def next_available_memory_slot(self):
        for slot_number in range(0, 64):
            # does any index take this?
            memory_slot_number = self.index_of_preset_with_memory_slot_number(slot_number)
            if memory_slot_number is None:
                return slot_number
        return None

    def add_to_index(self, new_preset):
        next_memory_slot = self.next_available_memory_slot
        if next_memory_slot is None:
            return None

        next_index = self.first_empty_index_position
        if next_index is None:
            return None

        new_preset.memory_slot = next_memory_slot
        new_preset.use_flag = 0x55aa  # Used
        self.indexes[next_index] = next_memory_slot

        return new_preset

    def range_of_presets(self):
        if self.first_empty_index_position is not None:
            return range(0, self.first_empty_index_position)
        return range(0, 64)

    def is_valid_index(self, index):
        return index in self.range_of_presets()

    def swap(self, index_one, index_two):
        if not self.is_valid_index(index_one):
            message = "Index one {0} is invalid".format(index_one)
            raise ObjectNotFoundException(message)
        if not self.is_valid_index(index_two):
            message = "Index two {0} is invalid".format(index_two)
            raise ObjectNotFoundException(message)

        value1 = self.indexes[index_one]
        value2 = self.indexes[index_two]
        self.indexes[index_one] = value2
        self.indexes[index_two] = value1

    @property
    def number_of_presets(self):
        first_empty_slot = self.first_empty_index_position
        if not first_empty_slot:
            return len(self.indexes)
        return first_empty_slot

    @property
    def first_empty_index_position(self):
        first_empty = None
        for i, index in enumerate(self.indexes):
            if index == 255:
                first_empty = i
                break

        return first_empty

    def delete_item_at_index(self, index, validate=True):
        if self.is_valid_index(index):
            del self.indexes[index]
            if validate:
                self._validate_and_fix_index_list()

    def _validate_and_fix_index_list(self):
        # Add 255's on the end until we have 64 of them
        # this also clears out any other 0's and other stuff.
        if self.first_empty_index_position is not None:
            for index in range(self.first_empty_index_position, 64):
                if index < len(self.indexes):
                    self.indexes[index] = 255
                else:
                    self.indexes.append(255)

        # Indexes must be unique
        set_of_seen = {}
        current_position = 0
        while current_position < self.number_of_presets - 1:
            index_at_this_position = self.indexes[current_position]
            if set_of_seen.get(index_at_this_position, None):
                # if we've already seen it, we should delete this one
                self.delete_item_at_index(current_position, validate=False)

                # Don't inc counter, as we've deleted one
            else:
                set_of_seen[index_at_this_position] = 1
                current_position += 1

    def set_indexes(self, new_value):
        self.indexes = copy.deepcopy(new_value)
        self._validate_and_fix_index_list()

    def set_from_modbus_data(self, count, indexes):
        self.set_indexes(indexes)

    @serializable
    def count(self):
        # The number of non-255 index positions
        return self.number_of_presets

    def to_modbus_data(self):
        v1 = [self.number_of_presets, ]
        v1.extend(self.indexes[:32])
        v2 = self.indexes[32:]
        return v1, v2


class Preset(Model):
    # The memory slot that this Preset occupies
    memory_slot = IntType(required=True, min_value=0, max_value=63, serialized_name="index")

    use_flag = LongType(required=True, choices=[0xffff, 0x55aa, 0x0000])
    name = StringType(required=True, max_length=37)
    capacity = LongType(required=True)
    auto_save = BooleanType(required=True, default=False)
    li_balance_end_mode = IntType(required=True, default=0)
    op_enable_mask = IntType(required=True, default=0xff)

    channel_mode = IntType(required=True, choices=[0, 1])
    save_to_sd = BooleanType(required=True, default=True)
    log_interval_sec = FloatType(required=True, min_value=0.5, max_value=60)
    run_counter = IntType(required=True)

    type = IntType(required=True, choices=[0, 1, 2, 3, 4, 5])
    li_cell = IntType(required=True)
    ni_cell = IntType(required=True)
    pb_cell = IntType(required=True, min_value=1, max_value=15)

    li_mode_c = IntType(required=True, choices=[0, 1])
    li_mode_d = IntType(required=True, min_value=1, max_value=3)  # this is a bitmask
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

    lipo_charge_cell_voltage = FloatType(required=True, min_value=3.85, max_value=4.35)
    lilo_charge_cell_voltage = FloatType(required=True, min_value=3.75, max_value=4.35)
    life_charge_cell_voltage = FloatType(required=True, min_value=3.3, max_value=3.8)

    lipo_storage_cell_voltage = FloatType(required=True, min_value=3.7, max_value=3.9)
    lilo_storage_cell_voltage = FloatType(required=True, min_value=3.6, max_value=3.8)
    life_storage_cell_voltage = FloatType(required=True, min_value=3.1, max_value=3.4)

    lipo_discharge_cell_voltage = FloatType(required=True, min_value=3, max_value=4.1)
    lilo_discharge_cell_voltage = FloatType(required=True, min_value=2.5, max_value=4)
    life_discharge_cell_voltage = FloatType(required=True, min_value=2, max_value=3.5)

    charge_current = FloatType(required=True, min_value=0.05, max_value=40)
    discharge_current = FloatType(required=True, min_value=0.05, max_value=40)
    end_charge = FloatType(required=True, min_value=1, max_value=50)
    end_discharge = FloatType(required=True, min_value=1, max_value=100)
    regen_discharge_mode = IntType(required=True, choices=[0, 1, 2])

    ni_peak = FloatType(required=True, min_value=1, max_value=20)
    ni_peak_delay = IntType(required=True, min_value=0, max_value=20)
    ni_trickle_enable = BooleanType(required=True)
    ni_trickle_current = FloatType(required=True, min_value=0.02, max_value=1)
    ni_trickle_time = IntType(required=True, min_value=1, max_value=999)

    ni_zero_enable = BooleanType(required=True)

    ni_discharge_voltage = FloatType(required=True, min_value=0.1, max_value=33)
    pb_charge_voltage = FloatType(required=True, min_value=2, max_value=2.6)
    pb_discharge_voltage = FloatType(required=True, min_value=1.5, max_value=2.4)
    pb_cell_float_enable = BooleanType(required=True)
    pb_cell_float_voltage = FloatType(required=True)

    restore_voltage = FloatType(required=True, min_value=0.5, max_value=2.5)
    restore_time = IntType(required=True, min_value=1, max_value=5)
    restore_current = FloatType(required=True, min_value=0.02, max_value=0.5)

    cycle_count = IntType(required=True, min_value=1, max_value=99)
    cycle_delay = IntType(required=True, min_value=0, max_value=3000)  # charger goes more. I set an arbitrary limit.
    cycle_mode = IntType(required=True, choices=[0, 1, 2, 3, 4, 5])

    safety_time_c = IntType(required=True, min_value=0)
    safety_cap_c = IntType(required=True, min_value=50, max_value=200)
    safety_temp_c = FloatType(required=True, min_value=20, max_value=80)

    safety_time_d = IntType(required=True, min_value=0)
    safety_cap_d = IntType(required=True, min_value=50, max_value=200)
    safety_temp_d = FloatType(required=True, min_value=20, max_value=80)

    reg_ch_mode = IntType(required=True, choices=[0, 1, 2])
    reg_ch_volt = FloatType(required=True, min_value=0.1, max_value=33)
    reg_ch_current = FloatType(required=True, min_value=0.05, max_value=40)

    fast_store = BooleanType(required=True, default=True)
    store_compensation = FloatType(required=True, min_value=0, max_value=0.2)

    ni_zn_charge_cell_volt = FloatType(required=True, min_value=1.2, max_value=2)
    ni_zn_discharge_cell_volt = FloatType(required=True, min_value=0.844, max_value=1.6)
    ni_zn_cell = IntType(required=True, default=0, min_value=0, max_value=10)

    @staticmethod
    def modbus(index, ds1=None, ds2=None, ds3=None, ds4=None, ds5=None):
        if ds1 is not None and ds2 is not None and ds3 is not None and ds4 is not None and ds5 is not None:
            p = Preset()
            p.memory_slot = index
            p.set_from_modbus_data(ds1, ds2, ds3, ds4, ds5)
            return p
        return None

    def verify_can_be_written_or_deleted(self):
        if self.is_fixed:
            # raise ObjectNotFoundException("This preset exists, but is marked as 'fixed' (read only)")
            pass
        return True

    def _test_bit_set(self, offset):
        mask = (1 << offset)
        return (self.op_enable_mask & mask) > 0

    def _set_or_clear_bit(self, offset, bool_value):
        mask = (1 << offset)
        if not bool_value:
            self.op_enable_mask &= ~mask
        else:
            self.op_enable_mask |= mask

    @property
    def is_unused(self):
        return not self.is_used

    @property
    def is_fixed(self):
        return self.use_flag == 0

    @property
    def is_used(self):
        return self.use_flag == 0x55aa

    @property
    def charge_enabled(self):
        return self._test_bit_set(0)

    @charge_enabled.setter
    def charge_enabled(self, new_value):
        self._set_or_clear_bit(0, new_value)

    @property
    def storage_enabled(self):
        return self._test_bit_set(2)

    @storage_enabled.setter
    def storage_enabled(self, new_value):
        self._set_or_clear_bit(2, new_value)

    @property
    def discharge_enabled(self):
        return self._test_bit_set(3)

    @discharge_enabled.setter
    def discharge_enabled(self, new_value):
        self._set_or_clear_bit(3, new_value)

    @property
    def cycle_enabled(self):
        return self._test_bit_set(4)

    @cycle_enabled.setter
    def cycle_enabled(self, new_value):
        self._set_or_clear_bit(4, new_value)

    @property
    def balance_enabled(self):
        return self._test_bit_set(5)

    @balance_enabled.setter
    def balance_enabled(self, new_value):
        self._set_or_clear_bit(5, new_value)

    @property
    def extra_discharge_enable(self):
        return self.li_mode_d & 0x01 == 0x01

    @extra_discharge_enable.setter
    def extra_discharge_enable(self, value):
        if value:
            self.li_mode_d |= 0x01
        else:
            self.li_mode_d &= ~0x01

    @property
    def discharge_balance_enable(self):
        return self.li_mode_d & 0x02 == 0x02

    @discharge_balance_enable.setter
    def discharge_balance_enable(self, value):
        if value:
            self.li_mode_d |= 0x02
        else:
            self.li_mode_d &= ~0x02

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

    def to_modbus_data(self):
        new_name = self.name
        if type(new_name) is unicode:
            new_name = new_name.encode('utf8')
        v1 = (self.use_flag,
              new_name,
              self.capacity,
              self.auto_save,
              self.li_balance_end_mode,
              chr(0xff), chr(0xff), chr(0xff), chr(0xff), chr(0xff), chr(0xff), chr(0xff),  # 7 reserved bytes
              self.op_enable_mask,
              self.channel_mode)

        v2 = (self.save_to_sd,
              int(self.log_interval_sec * 10),
              self.run_counter,
              self.type,
              self.li_cell,
              self.ni_cell,
              self.pb_cell,
              self.li_mode_c,
              self.li_mode_d,
              self.ni_mode_c,
              self.ni_mode_d,
              self.pb_mode_c,
              self.pb_mode_d,
              self.bal_speed,
              self.bal_start_mode,
              int(self.bal_start_voltage * 1000),
              self.bal_diff,
              self.bal_over_point,
              self.bal_set_point)

        v3 = (self.bal_delay,
              self.keep_charge_enable,

              int(self.lipo_charge_cell_voltage * 1000),
              int(self.lilo_charge_cell_voltage * 1000),
              int(self.life_charge_cell_voltage * 1000),

              int(self.lipo_storage_cell_voltage * 1000),
              int(self.lilo_storage_cell_voltage * 1000),
              int(self.life_storage_cell_voltage * 1000),

              int(self.lipo_discharge_cell_voltage * 1000),
              int(self.lilo_discharge_cell_voltage * 1000),
              int(self.life_discharge_cell_voltage * 1000),

              int(self.charge_current * 100),
              int(self.discharge_current * 100),
              self.end_charge,
              self.end_discharge,
              self.regen_discharge_mode)

        v4 = (self.ni_peak,
              self.ni_peak_delay,
              self.ni_trickle_enable,
              int(self.ni_trickle_current * 100),
              self.ni_trickle_time,
              self.ni_zero_enable,
              int(self.ni_discharge_voltage * 1000),
              int(self.pb_charge_voltage * 1000),
              int(self.pb_discharge_voltage * 1000),
              self.pb_cell_float_enable,
              int(self.pb_cell_float_voltage * 1000),
              int(self.restore_voltage * 1000),
              self.restore_time,
              int(self.restore_current * 100),
              self.cycle_count,
              self.cycle_delay)

        v5 = (self.cycle_mode,
              self.safety_time_c,
              self.safety_cap_c,
              int(self.safety_temp_c * 10),
              self.safety_time_d,
              self.safety_cap_d,
              int(self.safety_temp_d * 10),
              self.reg_ch_mode,
              int(self.reg_ch_volt * 1000),
              int(self.reg_ch_current * 100),
              self.fast_store,
              self.store_compensation * 100,
              int(self.ni_zn_charge_cell_volt * 1000),
              int(self.ni_zn_discharge_cell_volt * 1000),
              self.ni_zn_cell)

        return v1, v2, v3, v4, v5

    def set_from_modbus_data(self, ds1, ds2, ds3, ds4, ds5):
        (self.use_flag,
         self.name,
         self.capacity,
         self.auto_save,
         self.li_balance_end_mode,
         a, b, c, d, e, f, g,  # 7 reserved bytes
         self.op_enable_mask,
         self.channel_mode) = ds1.data

        (self.save_to_sd,
         self.log_interval_sec,
         self.run_counter,
         self.type,
         self.li_cell,
         self.ni_cell,
         self.pb_cell,
         self.li_mode_c,
         self.li_mode_d,
         self.ni_mode_c,
         self.ni_mode_d,
         self.pb_mode_c,
         self.pb_mode_d,
         self.bal_speed,
         self.bal_start_mode,
         self.bal_start_voltage,
         self.bal_diff,
         self.bal_over_point,
         self.bal_set_point) = ds2.data

        (self.bal_delay,
         self.keep_charge_enable,
         self.lipo_charge_cell_voltage,
         self.lilo_charge_cell_voltage,
         self.life_charge_cell_voltage,
         self.lipo_storage_cell_voltage,
         self.lilo_storage_cell_voltage,
         self.life_storage_cell_voltage,
         self.lipo_discharge_cell_voltage,
         self.lilo_discharge_cell_voltage,
         self.life_discharge_cell_voltage,
         self.charge_current,
         self.discharge_current,
         self.end_charge,
         self.end_discharge,
         self.regen_discharge_mode) = ds3.data

        (self.ni_peak,
         self.ni_peak_delay,
         self.ni_trickle_enable,
         self.ni_trickle_current,
         self.ni_trickle_time,
         self.ni_zero_enable,
         self.ni_discharge_voltage,
         self.pb_charge_voltage,
         self.pb_discharge_voltage,
         self.pb_cell_float_enable,
         self.pb_cell_float_voltage,
         self.restore_voltage,
         self.restore_time,
         self.restore_current,
         self.cycle_count,
         self.cycle_delay) = ds4.data

        (self.cycle_mode,
         self.safety_time_c,
         self.safety_cap_c,
         self.safety_temp_c,
         self.safety_time_d,
         self.safety_cap_d,
         self.safety_temp_d,
         self.reg_ch_mode,
         self.reg_ch_volt,
         self.reg_ch_current,
         self.fast_store,
         self.store_compensation,
         self.ni_zn_charge_cell_volt,
         self.ni_zn_discharge_cell_volt,
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

        self.ni_discharge_voltage /= 1000.0

        self.bal_start_voltage /= 1000.0
        self.charge_current /= 100.0
        self.discharge_current /= 100.0

        self.ni_trickle_current /= 100.0
        self.ni_zn_charge_cell_volt /= 1000.0
        self.ni_zn_discharge_cell_volt /= 1000.0

        self.pb_cell_float_voltage /= 1000.0
        self.pb_charge_voltage /= 1000.0
        self.pb_discharge_voltage /= 1000.0

        self.reg_ch_current /= 100
        self.reg_ch_volt /= 1000.0
        self.restore_current /= 100.0
        self.restore_voltage /= 1000.0

        self.log_interval_sec /= 10.0
        self.safety_temp_d /= 10.0
        self.safety_temp_c /= 10.0

        self.store_compensation /= 100.0

        self.name = self.name.split('\0')[0]
