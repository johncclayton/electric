
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
        self.cell = 0
        self.voltage = 0
        self.balance = 0
        self.ir = 0
        self.set_from_modbus_data(c, volt, bal, i)

    def set_from_modbus_data(self, c, volt, bal, i):
        if volt == 1024:
            volt = 0
        if i == 1024:
            i = 0
        if bal == 1024:
            bal = 0

        self.cell = c
        self.voltage = volt
        self.balance = bal
        self.ir = i

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
        self.line_intern_resistance = 0
        self.cycle_count = 0
        self.control_status = 0
        self.run_status = 0
        self.run_error = 0
        self.dlg_box_id = 0

        if header is not None and cell_v is not None and cell_b is not None and cell_i is not None and footer is not None:
            self.set_from_modbus_data(channel, header, cell_v, cell_b, cell_i, footer)

    def set_from_modbus_data(self, channel, data, cell_v, cell_b, cell_i, footer):
        self.channel = channel
        self.timestamp = data[0]

        self.curr_out_power = data[1]
        self.curr_out_amps = data[2]
        self.curr_inp_volts = data[3] / 1000.0
        self.curr_out_volts = data[4] / 1000.0
        self.curr_out_capacity = data[5]
        self.curr_int_temp = data[6] / 1000.0
        self.curr_ext_temp = data[7] / 1000.0

        for x in range(0, 10):
            self.cells[x].set_from_modbus_data(x, cell_v[x], cell_b[x], cell_i[x])

        self.cell_total_ir = footer[0]
        self.line_intern_resistance = footer[1]
        self.cycle_count = footer[2]
        self.control_status = footer[3]
        self.run_status = footer[4]
        self.run_error = footer[5]
        self.dlg_box_id = footer[6]

    def to_dict(self):
        d = self.__dict__
        d["cells"] = [ self.cells[x].to_dict() for x in range(0, 10) ]
        return d


class Control:
    def __init__(self, modbus_data = None):
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
        self.order_lock = data[3]
        self.order = data[4]
        self.order_description = Control.order_description(self.order)
        self.limit_current = data[5] / 1000.0
        self.limit_volt = data[6] / 1000.0

    def to_dict(self):
        return self.__dict__


class Voltage:
    def __init__(self):
        self.charge_voltage = 0
        self.storage_voltage = 0
        self.discharge_voltage = 0


class Preset:
    def __init__(self):
        self.use_flag = 0
        self.name = ""
        self.capacity = 0
        self.auto_save = False
        self.li_balance_end_mode = 0
        self.op_enable_mask = 0xff
        self.channel_mode = 0
        self.save_to_sd = False
        self.log_interval = 0
        self.run_counter = 0

        self.type = 0
        self.li_cell = 0
        self.ni_cell = 0
        self.pb_cell = 0

        self.li_mode_c = 0
        self.li_mode_c = 0
        self.ni_mode_c = 0
        self.ni_mode_c = 0
        self.pb_mode_c = 0
        self.pb_mode_c = 0

        self.bal_speed = 0
        self.bal_start_mode = 0
        self.bal_start_voltage = 0
        self.bal_diff = 0
        self.bal_over_point = 0
        self.bal_set_point = 0
        self.bal_delay = 0

        self.keep_charge_enable = 0

        self.lipo_voltage = Voltage()
        self.lilo_voltage = Voltage()
        self.life_voltage = Voltage()

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

