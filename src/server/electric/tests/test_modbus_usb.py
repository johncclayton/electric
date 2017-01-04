import unittest, struct
import modbus_tk.defines as cst
from usb.core import USBError

from electric.icharger.modbus_usb import USBSerialFacade, iChargerQuery, iChargerMaster, testing_control, \
    MODBUS_HID_FRAME_TYPE
from electric.icharger.modbus_usb import testing_control
from modbus_tk.exceptions import ModbusInvalidRequestError, ModbusInvalidResponseError

from icharger.modbus_usb import TestingControlException


class TestChargerQuery(unittest.TestCase):
    def setUp(self):
        testing_control.usb_device_present = True
        self.query = iChargerQuery()

    def test_query_unpack_fails_with_short_data(self):
        with self.assertRaises(Exception) as context:
            self.query.build_request("a", "b")
        self.assertIsInstance(context.exception, struct.error)
        self.assertEquals(str(context.exception), "unpack requires a string argument of length 5")

    def test_query_build_request_fails_with_invalid_pdu(self):
        with self.assertRaises(ModbusInvalidRequestError) as context:
            self.query.build_request("abcdefghjik", "doesnt matter what this is")

    def test_query_request_can_read_input_registers(self):
        pdu = struct.pack(">BHH", cst.READ_INPUT_REGISTERS, 100, 70)
        self.query.build_request(pdu, "abc this doesn't matter")
        self.assertEqual(self.query.func_code, cst.READ_INPUT_REGISTERS)
        self.assertEqual(self.query.adu_len, 7)
        self.assertEqual(self.query.start_addr, 100)
        self.assertEqual(self.query.quantity, 70)

    def test_query_request_can_read_holding_registers(self):
        pdu = struct.pack(">BHH", cst.READ_HOLDING_REGISTERS, 200, 7)
        self.query.build_request(pdu, "abc this doesn't matter")
        self.assertEqual(self.query.func_code, cst.READ_HOLDING_REGISTERS)
        self.assertEqual(self.query.adu_len, 7)
        self.assertEqual(self.query.start_addr, 200)
        self.assertEqual(self.query.quantity, 7)

    def test_query_request_can_write(self):
        pdu = struct.pack(">BHH", cst.WRITE_MULTIPLE_REGISTERS, 0x800, 10)
        self.query.build_request(pdu, "who cares")
        self.assertEqual(self.query.func_code, cst.WRITE_MULTIPLE_REGISTERS)
        self.assertEqual(self.query.start_addr, 0x800)
        self.assertEqual(self.query.quantity, 10)

    def test_response_parse_failure(self):
        pdu = struct.pack(">BHH", cst.READ_HOLDING_REGISTERS, 200, 7)
        self.query.build_request(pdu, "abc this doesn't matter")
        response = struct.pack(">BBBB", 12, MODBUS_HID_FRAME_TYPE, self.query.func_code | 0x80, 4)
        with self.assertRaises(ModbusInvalidResponseError) as context:
            self.query.parse_response(response)
        self.assertEqual(4, self.query.modbus_error)
        self.assertIn("Response contains error code", str(context.exception))

    def test_response_invalid_frame_type(self):
        pdu = struct.pack(">BHH", cst.READ_HOLDING_REGISTERS, 200, 7)
        self.query.build_request(pdu, "abc this doesn't matter")
        response = struct.pack(">BBBB", 12, MODBUS_HID_FRAME_TYPE + 1, self.query.func_code | 0x80, 4)
        with self.assertRaises(ModbusInvalidResponseError) as context:
            self.query.parse_response(response)
        self.assertEqual(self.query.adu_constant, MODBUS_HID_FRAME_TYPE + 1)

    def test_response_with_invalid_func_error_code(self):
        pdu = struct.pack(">BHH", cst.READ_HOLDING_REGISTERS, 200, 7)
        self.query.build_request(pdu, "abc this doesn't matter")
        # hint: at the protocol level, 0x90 is complete bollocks.
        response = struct.pack(">BBBB", 12, MODBUS_HID_FRAME_TYPE, self.query.func_code | 0x90, 4)
        with self.assertRaises(ModbusInvalidResponseError) as context:
            self.query.parse_response(response)
        self.assertIn("isn't the same as the request func_code", str(context.exception))

    def test_short_response_is_caught(self):
        pdu = struct.pack(">BHH", cst.READ_HOLDING_REGISTERS, 200, 7)
        self.query.build_request(pdu, "abc this doesn't matter")
        # hint: a super short response is less than 3 bytes
        response = struct.pack(">B", 12)
        with self.assertRaises(ModbusInvalidResponseError) as context:
            self.query.parse_response(response)
        self.assertIn("Response length is invalid", str(context.exception))


class TestSerialFacade(unittest.TestCase):
    def setUp(self):
        testing_control.reset()

    def test_kernel_detach_fails(self):
        testing_control.usb_detach_from_kernel_should_fail = True

        charger = None
        with self.assertRaises(USBError) as context:
            charger = USBSerialFacade()

        self.assertIsNone(charger)
        self.assertIn("Failed to detach from the kernel", str(context.exception))


class TestMasterDevice(unittest.TestCase):
    def setUp(self):
        testing_control.reset()

    def test_bad_vendor_product_combo(self):
        charger = USBSerialFacade(0x9999, 0x9999)
        self.assertIsNotNone(charger)
        self.assertIsNone(charger._dev)

    def test_disconnected_charger_has_correct_presence_in_json(self):
        pass

    def test_status_contains_num_channels(self):
        obj = iChargerMaster()
        status = obj.get_device_info()
        self.assertIsNotNone(status)
        self.assertIn("channel_count", status.keys())

    def test_order_description(self):
        self.assertEqual(iChargerMaster.order_description(0), "run")
        self.assertEqual(iChargerMaster.order_description(1), "modify")
        self.assertEqual(iChargerMaster.order_description(2), "write system")
        self.assertEqual(iChargerMaster.order_description(3), "write memory head")
        self.assertEqual(iChargerMaster.order_description(4), "write memory")
        self.assertEqual(iChargerMaster.order_description(5), "trans log on")
        self.assertEqual(iChargerMaster.order_description(6), "trans log off")
        self.assertEqual(iChargerMaster.order_description(7), "msgbox yes")
        self.assertEqual(iChargerMaster.order_description(8), "msgbox no")

    def test_op_description(self):
        self.assertEqual(iChargerMaster.op_description(0), "charge")
        self.assertEqual(iChargerMaster.op_description(1), "storage")
        self.assertEqual(iChargerMaster.op_description(2), "discharge")
        self.assertEqual(iChargerMaster.op_description(3), "cycle")
        self.assertEqual(iChargerMaster.op_description(4), "balance only")

    def test_opening_claims_usb_interface(self):
        serial = USBSerialFacade()
        charger = iChargerMaster(serial=serial)
        self.assertEqual(serial.is_open, False)
        charger.open()
        self.assertEqual(serial.is_open, True)
        self.assertEqual(serial._claimed, True)
        charger.close()
        self.assertEqual(serial.is_open, False)
        self.assertEqual(serial._claimed, False)

    def test_modbus_read_throws_exception(self):
        testing_control.modbus_read_should_fail = True
        charger = iChargerMaster()
        status = charger.get_device_info()
        self.assertEqual(2, len(status.keys()))
        self.assertIn("exception", status.keys())

