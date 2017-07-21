

'''har har har

    def run_operation(self, the_op):

        channel_status = self.get_channel_status(channel_id)
        status = self.get_device_info()

        values = (
            CONSTANT_CHARGE,
            memory_index,
            channel_id
        )

        ret_values = self.charger.modbus_write_registers(0x8000, values)

        # clear the ORDER LOCK value (no idea why - the C++ code does this)
        self.charger.modbus_write_registers(0x8000 + 3, (0, ))


    for reference

       ModbusRequestError icharger_usb::order(OrderAction action, Channel ch, ProgramType program, int mem_index) {
            u16 data[5];

            switch(action) {
            case ORDER_RUN:
                data[0] = program;
                data[1] = mem_index;
                data[2] = (int)ch;
                data[3] = VALUE_ORDER_KEY; // 0x55aa
                data[4] = action;
                return write_request(REG_SEL_OP, 5, (char *)data);

            case ORDER_STOP:
                data[0] = VALUE_ORDER_KEY;
                data[1] = action;
                return write_request(REG_ORDER_KEY, 2, (char *)data);
            }

            return MB_EILLFUNCTION;
        }
'''
