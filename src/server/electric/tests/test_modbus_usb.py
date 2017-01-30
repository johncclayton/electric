import struct
import time
import unittest

import modbus_tk.defines as cst
from modbus_tk.exceptions import ModbusInvalidRequestError, ModbusInvalidResponseError

import electric.evil_global as evil_global
from electric.icharger.modbus_usb import TestingControlException
from electric.icharger.modbus_usb import USBSerialFacade, iChargerQuery, MODBUS_HID_FRAME_TYPE
from electric.icharger.modbus_usb import testing_control
from electric.icharger.models import Control


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
        with self.assertRaises(ModbusInvalidRequestError):
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

    def test_bad_vendor_product_combo(self):
        with self.assertRaises(IOError):
            s = USBSerialFacade(0x9999, 0x9999)
            s.open()

    def test_opening_claims_usb_interface(self):
        charger = evil_global.comms
        serial = charger.charger._serial
        serial.close()
        self.assertEqual(serial.is_open, False)
        serial.open()
        self.assertEqual(serial.is_open, True)
        serial.close()
        self.assertEqual(serial.is_open, False)


class TestGatewayCommunications(unittest.TestCase):
    def setUp(self):
        testing_control.reset()
        evil_global.comms.charger.open()

    def test_status_contains_num_channels(self):
        obj = evil_global.comms
        status = obj.get_device_info()
        self.assertIsNotNone(status)
        self.assertEqual(status.channel_count, 2)
        self.assertIn("channel_count", status.to_primitive().keys())

    def test_fetch_status(self):
        obj = evil_global.comms
        resp = obj.get_channel_status(0)
        self.assertIsNotNone(resp)

    def test_number_of_channels(self):
        obj = evil_global.comms
        resp = obj.get_device_info()
        self.assertTrue(resp.cell_count >= 6)

    def test_order_description(self):
        c = Control()
        c.order = 0
        self.assertEqual(c.order_description, "run")

        c.order = 1
        self.assertEqual(c.order_description, "modify")

    def test_op_description(self):
        c = Control()
        c.op = 0
        self.assertEqual(c.op_description, "charge")

        c.op = 1
        self.assertEqual(c.op_description, "storage")

    def test_modbus_read_throws_exception(self):
        testing_control.modbus_read_should_fail = True

        with self.assertRaises(TestingControlException):
            charger = evil_global.comms
            charger.get_device_info()

    def test_can_change_key_tone_and_volume(self):
        charger = evil_global.comms
        new_volume = 2
        charger.set_beep_properties(beep_index=0, enabled=True, volume=new_volume)
        resp = charger.get_system_storage()
        self.assertEqual(resp.beep_enabled_key, 1)
        self.assertEqual(resp.beep_volume_key, new_volume)

    def test_setting_active_channel(self):
        charger = evil_global.comms
        self.assertIsNone(charger.set_active_channel(-1))
        self.assertIsNone(charger.set_active_channel(2))
        resp = charger.set_active_channel(0)
        self.assertIsNotNone(resp)
        resp = charger.set_active_channel(1)
        self.assertIsNotNone(resp)

    def test_get_all_presets(self):
        charger = evil_global.comms
        preset_index = charger.get_full_preset_list()
        for index in preset_index.range_of_presets():
            slot = preset_index.indexes[index]
            one_preset = charger.get_preset(slot)
            print(one_preset.name)

    def test_get_preset_index_list(self):
        obj = evil_global.comms
        preset_index = obj.get_full_preset_list()
        self.assertIsNotNone(preset_index)
        self.assertTrue(preset_index.count == len(preset_index.number_of_presets))

    # def test_wont_cause_fire_while_charging(self):
    #     # fetch status/channel info - what are the flags
    #     # start a charge/discharge cycle uysing preset 0
    #     # fetch status/channel info - what are the flags
    #     # change the amps in the preset, watch what happens
    #     charger = evil_global.comms
    #     preset_0 = charger.get_preset(0)
    #     self.assertIsNotNone(preset_0)
    #     info = charger.get_device_info()
    #     channel_0 = charger.get_channel_status(0)
    #     # now dear user... start a charge..
    #     print("now is the time to begin charging!! you have 10 seconds")
    #     time.sleep(1)
    #     preset_0.charge_current = 11
    #     charger.save_preset(preset_0)
    #

