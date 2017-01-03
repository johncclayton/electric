import unittest, struct
import usb.core
import modbus_tk.defines as cst

from electric.icharger.modbus_usb import iChargerUSBSerialFacade, iChargerQuery, iChargerMaster
from modbus_tk.exceptions import ModbusInvalidRequestError

class iChargerModUsbTestCase(unittest.TestCase):
    # def test_raises_backend_error_with_no_libusb(self):
    #     with self.assertRaises(usb.core.NoBackendError) as context:
    #         iChargerUSBSerialFacade(0x9999, 0x9999)

    def test_bad_vendor_product_combo(self):
        charger = iChargerUSBSerialFacade(0x9999, 0x9999)
        self.assertIsNotNone(charger)

    def test_disconnected_charger_has_correct_presence_in_json(self):
        # TODO: validate that a crap iChargerUSBSerialFacade results in the charger being disconnected
        # for valid URIs
        pass

    def test_status_contains_num_channels(self):
        obj = iChargerMaster()
        status = obj.get_device_info()
        self.assertIsNotNone(status)

    def test_query_unpack_fails_with_short_data(self):
        query = iChargerQuery()
        with self.assertRaises(Exception) as context:
            query.build_request("a", "b")
        self.assertIsInstance(context.exception, struct.error)
        self.assertEquals(str(context.exception), "unpack requires a string argument of length 5")

    def test_query_build_request_fails_with_invalid_pdu(self):
        query = iChargerQuery()
        with self.assertRaises(ModbusInvalidRequestError) as context:
            query.build_request("abcdefghjik", "doesnt matter what this is")

    def test_query_request_can_read_input_registers(self):
        query = iChargerQuery()
        pdu = struct.pack(">BHH", cst.READ_INPUT_REGISTERS, 100, 70)
        query.build_request(pdu, "abc this doesn't matter")
        self.assertEqual(query.func_code, cst.READ_INPUT_REGISTERS)
        self.assertEqual(query.adu_len, 7)
        self.assertEqual(query.start_addr, 100)
        self.assertEqual(query.quantity, 70)

    def test_query_request_can_read_holding_registers(self):
        query = iChargerQuery()
        pdu = struct.pack(">BHH", cst.READ_HOLDING_REGISTERS, 200, 7)
        query.build_request(pdu, "abc this doesn't matter")
        self.assertEqual(query.func_code, cst.READ_HOLDING_REGISTERS)
        self.assertEqual(query.adu_len, 7)
        self.assertEqual(query.start_addr, 200)
        self.assertEqual(query.quantity, 7)

    def test_query_request_can_write(self):
        query = iChargerQuery()
        pdu = struct.pack(">BHH", cst.WRITE_MULTIPLE_REGISTERS, 0x800, 10)
        query.build_request(pdu, "who cares")
        self.assertEqual(query.func_code, cst.WRITE_MULTIPLE_REGISTERS)
        self.assertEqual(query.start_addr, 0x800)
        self.assertEqual(query.quantity, 10)

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
